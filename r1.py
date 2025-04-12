import os
import json
import http.client
import time
from typing import List, Dict, Any, Optional, Union

# ============================
# DeepSeek MODEL REGISTRY
# ============================
DEEPSEEK_MODELS = {
    "r1": "ep-20250408134926-wr5rk",
}

class DeepSeekClient:
    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = "ark.ap-southeast.bytepluses.com",
        api_path: str = "/api/v3/chat/completions",
        model_id: str = DEEPSEEK_MODELS["r1"],
        timeout: int = 60
    ):
        self.api_key = api_key or os.environ.get("API_KEY", "d81f926b-3af8-4e0a-ab35-c4b00935c85c")
        self.base_url = base_url
        self.api_path = api_path
        self.model_id = model_id
        self.timeout = timeout
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
    
    def _create_connection(self) -> http.client.HTTPSConnection:
        return http.client.HTTPSConnection(self.base_url, timeout=self.timeout)
    
    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 1024,
        stream: bool = False,
        **kwargs
    ) -> Union[Dict[str, Any], None]:
        request_data = {
            "model": self.model_id,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream,
            **kwargs
        }
        
        conn = self._create_connection()
        
        try:
            conn.request("POST", self.api_path, body=json.dumps(request_data), headers=self.headers)
            response = conn.getresponse()
            
            if response.status != 200:
                print(f"Lỗi API (HTTP {response.status}): {response.reason}")
                error_data = json.loads(response.read().decode())
                print(f"Chi tiết lỗi: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
                return None
                
            if stream:
                self._handle_streaming_response(response)
                return None
            else:
                return json.loads(response.read().decode())

        except Exception as e:
            print(f"Lỗi kết nối: {str(e)}")
            return None
        finally:
            conn.close()
    
    def _handle_streaming_response(self, response):
        print("Bắt đầu nhận dữ liệu streaming...")
        try:
            buffer = b""
            while True:
                chunk = response.read(1)
                if not chunk:
                    break
                buffer += chunk
                if buffer.endswith(b"\n\n"):
                    line = buffer.decode("utf-8").strip()
                    buffer = b""
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        try:
                            event = json.loads(data)
                            if "choices" in event and len(event["choices"]) > 0:
                                delta = event["choices"][0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    print(content, end="", flush=True)
                        except json.JSONDecodeError:
                            pass
            print()
        except Exception as e:
            print(f"\nLỗi khi xử lý streaming: {str(e)}")

def chat_loop():
    print("\n===== 🤖 DeepSeek Chatbot =====")
    print("Nhập 'exit' hoặc 'quit' để thoát chương trình.\n")

    model_key = os.environ.get("MODEL_KEY", "r1")
    api_key = os.environ.get("API_KEY", "")
    model_id = DEEPSEEK_MODELS.get(model_key, DEEPSEEK_MODELS["r1"])

    client = DeepSeekClient(
        api_key=api_key,
        model_id=model_id
    )

    system_msg = {
        "role": "system",
        "content": "Bạn là trợ lý AI thông minh được phát triển bởi DeepSeek, hãy trả lời ngắn gọn, dễ hiểu và tự nhiên bằng tiếng Việt."
    }
    messages = [system_msg]

    while True:
        user_input = input("\n👤 Bạn: ").strip()
        if user_input.lower() in ["exit", "quit"]:
            print("\n👋 Tạm biệt!")
            break
        if not user_input:
            continue

        messages.append({"role": "user", "content": user_input})

        print("🤖 Bot: ", end="", flush=True)
        start_time = time.time()
    
        response = client.chat_completion(
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
            stream=True
        )

        messages.append({"role": "assistant", "content": "[Streaming Response]"})
        print(f"\n⏱️ Thời gian phản hồi: {time.time() - start_time:.2f}s")

        if len(messages) > 30:
            messages = [system_msg] + messages[-29:]

if __name__ == "__main__":
    chat_loop()
