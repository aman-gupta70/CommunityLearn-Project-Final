# ai_service.py - AI/ML Microservice for CommunityLearn
from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer, util
import numpy as np
import re
from typing import List, Dict
import json

app = Flask(__name__)
CORS(app)

# Load the sentence transformer model
print("Loading AI models...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("✅ Models loaded successfully!")

# In-memory storage for embeddings (use database in production)
embeddings_store = {}

def preprocess_text(text: str) -> str:
    """Clean and normalize text"""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s]', '', text)  # Remove punctuation
    text = re.sub(r'\s+', ' ', text)  # Normalize whitespace
    return text

def extract_keywords(text: str, top_k: int = 5) -> List[str]:
    """Simple keyword extraction"""
    words = text.lower().split()
    # Filter out common stop words
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were'}
    keywords = [w for w in words if w not in stop_words and len(w) > 3]
    # Get unique keywords
    unique_keywords = []
    seen = set()
    for word in keywords:
        if word not in seen:
            unique_keywords.append(word)
            seen.add(word)
    return unique_keywords[:top_k]

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'CommunityLearn AI Service',
        'model': 'all-MiniLM-L6-v2'
    })

@app.route('/api/ai/embed', methods=['POST'])
def create_embedding():
    """Create embedding for text"""
    try:
        data = request.json
        text = data.get('text', '')
        content_id = data.get('content_id')
        content_type = data.get('content_type', 'general')
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        # Generate embedding
        embedding = model.encode(text, convert_to_tensor=False)
        
        # Store embedding if content_id provided
        if content_id:
            key = f"{content_type}_{content_id}"
            embeddings_store[key] = {
                'embedding': embedding.tolist(),
                'text': text,
                'content_type': content_type
            }
        
        return jsonify({
            'embedding': embedding.tolist(),
            'dimension': len(embedding)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/semantic-search', methods=['POST'])
def semantic_search():
    """Semantic search using embeddings"""
    try:
        data = request.json
        query = data.get('query', '')
        documents = data.get('documents', [])
        top_k = data.get('top_k', 5)
        
        if not query or not documents:
            return jsonify({'error': 'Query and documents are required'}), 400
        
        # Generate query embedding
        query_embedding = model.encode(query, convert_to_tensor=True)
        
        # Generate document embeddings
        doc_embeddings = model.encode(documents, convert_to_tensor=True)
        
        # Calculate cosine similarities
        similarities = util.cos_sim(query_embedding, doc_embeddings)[0]
        
        # Get top-k results
        top_results = []
        for idx in similarities.argsort(descending=True)[:top_k]:
            top_results.append({
                'index': int(idx),
                'document': documents[int(idx)],
                'similarity': float(similarities[idx])
            })
        
        return jsonify({
            'results': top_results,
            'query': query
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/grade-answer', methods=['POST'])
def grade_answer():
    """Auto-grade short answer using semantic similarity"""
    try:
        data = request.json
        student_answer = data.get('student_answer', '')
        model_answer = data.get('model_answer', '')
        max_score = data.get('max_score', 100)
        
        if not student_answer or not model_answer:
            return jsonify({'error': 'Both student and model answers are required'}), 400
        
        # Preprocess answers
        student_clean = preprocess_text(student_answer)
        model_clean = preprocess_text(model_answer)
        
        # Generate embeddings
        student_emb = model.encode(student_clean, convert_to_tensor=True)
        model_emb = model.encode(model_clean, convert_to_tensor=True)
        
        # Calculate similarity
        similarity = util.cos_sim(student_emb, model_emb).item()
        
        # Determine score and feedback
        if similarity >= 0.82:
            score = max_score
            feedback = "Excellent! Your answer demonstrates a strong understanding of the concept."
            grade_level = "excellent"
        elif similarity >= 0.65:
            score = int(max_score * 0.7)
            feedback = "Good effort! Your answer covers most key points but could be more complete."
            grade_level = "good"
        elif similarity >= 0.45:
            score = int(max_score * 0.5)
            feedback = "Partial understanding shown. Review the material and focus on key concepts."
            grade_level = "partial"
        else:
            score = int(max_score * 0.3)
            feedback = "Needs improvement. Please review the material and try again."
            grade_level = "needs_improvement"
        
        # Extract missing keywords
        model_keywords = set(extract_keywords(model_answer))
        student_keywords = set(extract_keywords(student_answer))
        missing_keywords = list(model_keywords - student_keywords)
        
        return jsonify({
            'score': score,
            'max_score': max_score,
            'percentage': round((score / max_score) * 100, 2),
            'similarity': round(similarity, 4),
            'feedback': feedback,
            'grade_level': grade_level,
            'missing_keywords': missing_keywords[:5],
            'suggestions': [
                f"Consider including: {', '.join(missing_keywords[:3])}" if missing_keywords else "Great coverage of key concepts!"
            ]
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/compare-answers', methods=['POST'])
def compare_answers():
    """Compare multiple student answers"""
    try:
        data = request.json
        answers = data.get('answers', [])
        
        if len(answers) < 2:
            return jsonify({'error': 'At least 2 answers required for comparison'}), 400
        
        # Generate embeddings for all answers
        embeddings = model.encode(answers, convert_to_tensor=True)
        
        # Calculate similarity matrix
        similarity_matrix = util.cos_sim(embeddings, embeddings)
        
        # Find most similar and most different pairs
        results = []
        for i in range(len(answers)):
            for j in range(i + 1, len(answers)):
                results.append({
                    'answer1_index': i,
                    'answer2_index': j,
                    'similarity': float(similarity_matrix[i][j])
                })
        
        # Sort by similarity
        results.sort(key=lambda x: x['similarity'], reverse=True)
        
        return jsonify({
            'comparisons': results,
            'most_similar': results[0] if results else None,
            'least_similar': results[-1] if results else None
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/recommend-resources', methods=['POST'])
def recommend_resources():
    """Recommend resources based on user interests and query"""
    try:
        data = request.json
        query = data.get('query', '')
        user_interests = data.get('user_interests', [])
        available_resources = data.get('resources', [])
        top_k = data.get('top_k', 5)
        
        if not available_resources:
            return jsonify({'error': 'Resources list is required'}), 400
        
        # Create composite query from user query and interests
        composite_query = f"{query} {' '.join(user_interests)}"
        
        # Extract resource texts (title + description)
        resource_texts = [
            f"{r.get('title', '')} {r.get('description', '')}"
            for r in available_resources
        ]
        
        # Generate embeddings
        query_emb = model.encode(composite_query, convert_to_tensor=True)
        resource_embs = model.encode(resource_texts, convert_to_tensor=True)
        
        # Calculate similarities
        similarities = util.cos_sim(query_emb, resource_embs)[0]
        
        # Get top recommendations
        recommendations = []
        for idx in similarities.argsort(descending=True)[:top_k]:
            resource = available_resources[int(idx)].copy()
            resource['relevance_score'] = float(similarities[idx])
            resource['recommendation_reason'] = (
                "Highly relevant to your interests" if similarities[idx] > 0.7 else
                "Good match for your query" if similarities[idx] > 0.5 else
                "May be helpful"
            )
            recommendations.append(resource)
        
        return jsonify({
            'recommendations': recommendations,
            'query': query,
            'user_interests': user_interests
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/tutor-matching', methods=['POST'])
def match_tutors():
    """Match students with tutors based on skills and interests"""
    try:
        data = request.json
        student_needs = data.get('student_needs', '')
        tutors = data.get('tutors', [])
        top_k = data.get('top_k', 3)
        
        if not tutors:
            return jsonify({'error': 'Tutors list is required'}), 400
        
        # Create tutor profiles text
        tutor_texts = [
            f"{t.get('name', '')} specializes in {' '.join(t.get('skills', []))} {t.get('bio', '')}"
            for t in tutors
        ]
        
        # Generate embeddings
        needs_emb = model.encode(student_needs, convert_to_tensor=True)
        tutor_embs = model.encode(tutor_texts, convert_to_tensor=True)
        
        # Calculate similarities
        similarities = util.cos_sim(needs_emb, tutor_embs)[0]
        
        # Get top matches
        matches = []
        for idx in similarities.argsort(descending=True)[:top_k]:
            tutor = tutors[int(idx)].copy()
            match_score = float(similarities[idx])
            tutor['match_score'] = match_score
            tutor['match_quality'] = (
                "Excellent Match" if match_score > 0.7 else
                "Good Match" if match_score > 0.5 else
                "Potential Match"
            )
            matches.append(tutor)
        
        return jsonify({
            'matches': matches,
            'student_needs': student_needs
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/extract-topics', methods=['POST'])
def extract_topics():
    """Extract main topics from text"""
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        # Simple topic extraction using keywords
        keywords = extract_keywords(text, top_k=10)
        
        # Group related keywords (simple approach)
        topics = []
        if len(keywords) >= 3:
            topics.append({
                'topic': ' '.join(keywords[:3]),
                'keywords': keywords[:3],
                'confidence': 0.8
            })
        if len(keywords) >= 6:
            topics.append({
                'topic': ' '.join(keywords[3:6]),
                'keywords': keywords[3:6],
                'confidence': 0.6
            })
        
        return jsonify({
            'topics': topics,
            'all_keywords': keywords
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting CommunityLearn AI Microservice...")
    print("📊 Endpoints available:")
    print("   - POST /api/ai/embed - Create text embeddings")
    print("   - POST /api/ai/semantic-search - Semantic search")
    print("   - POST /api/ai/grade-answer - Auto-grade answers")
    print("   - POST /api/ai/compare-answers - Compare multiple answers")
    print("   - POST /api/ai/recommend-resources - Resource recommendations")
    print("   - POST /api/ai/tutor-matching - Match students with tutors")
    print("   - POST /api/ai/extract-topics - Extract topics from text")
    print("   - GET /health - Health check")
    app.run(host='0.0.0.0', port=5001, debug=True)