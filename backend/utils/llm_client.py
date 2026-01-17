"""
Featherless.ai API Client

HTTP client for calling Featherless.ai LLM API
"""

import httpx
import os
from typing import Optional


class FeatherlessClient:
    """Client for interacting with Featherless.ai API"""

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Featherless API client

        Args:
            api_key: Featherless.ai API key (defaults to FEATHERLESS_API_KEY env var)
        """
        self.api_key = api_key or os.getenv("FEATHERLESS_API_KEY")
        if not self.api_key:
            raise ValueError("FEATHERLESS_API_KEY not found in environment")

        self.base_url = "https://api.featherless.ai/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def generate_completion(
        self,
        prompt: str,
        model: str = "meta-llama/Meta-Llama-3.1-8B-Instruct",
        max_tokens: int = 1000,
        temperature: float = 0.7,
    ) -> str:
        """
        Generate text completion using Featherless.ai

        Args:
            prompt: Input prompt text
            model: Model identifier (default: Meta-Llama-3.1-8B-Instruct)
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature

        Returns:
            str: Generated text completion
        """
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=self.headers,
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": max_tokens,
                        "temperature": temperature,
                    },
                    timeout=60.0,
                )
                response.raise_for_status()

                data = response.json()
                return (
                    data.get("choices", [{}])[0].get("message", {}).get("content", "")
                )

            except httpx.HTTPError as e:
                raise Exception(f"Featherless API error: {str(e)}")

    async def analyze_compliance(self, policy_text: str, system_prompt: str) -> dict:
        """
        Analyze compliance using structured prompt

        Args:
            policy_text: Privacy policy text to analyze
            system_prompt: System prompt defining analysis task

        Returns:
            dict: Analysis results
        """
        full_prompt = (
            f"{system_prompt}\n\nPrivacy Policy:\n{policy_text}\n\nProvide analysis:"
        )

        response_text = await self.generate_completion(
            prompt=full_prompt,
            max_tokens=2000,
            temperature=0.3,  # Lower temperature for consistent analysis
        )

        # TODO: Parse LLM response into structured format
        return {
            "analysis": response_text,
            "score": 0,
            "issues": [],
            "recommendations": [],
        }
