import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv('../.env')

class EmbeddingsGenerator:
    def __init__(self):
        """Initialize OpenAI client"""
        self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.model = "text-embedding-3-small"
        print(f"Embeddings generator initialized (model={self.model})")
    
    def generate_embedding(self, text):
        """
        Generate embedding for a single text
        Returns: List of 1536 floats
        """
        response = self.client.embeddings.create(
            model=self.model,
            input=text
        )
        return response.data[0].embedding
    
    def generate_batch(self, texts, batch_size=100):
        """
        Generate embeddings for multiple texts in batches
        """
        embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            
            response = self.client.embeddings.create(
                model=self.model,
                input=batch
            )
            
            batch_embeddings = [item.embedding for item in response.data]
            embeddings.extend(batch_embeddings)
            
            print(f"Generated embeddings for {len(batch)} chunks ({i + len(batch)}/{len(texts)})")
        
        print(f"Generated {len(embeddings)} embeddings")
        return embeddings