document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const chatMessages = document.getElementById('chat-messages');
    const welcomeScreen = document.getElementById('welcome-screen');
    const exampleButtons = document.querySelectorAll('.example-button');
    const chatContainer = document.querySelector('.chat-container');
  
    // Deepseek API Key & Endpoint - chỉ để hiển thị, không sử dụng trong demo
    const API_KEY = 'd81f926b-3af8-4e0a-ab35-c4b00935c85c';
    const API_URL = 'https://api.deepseek.ai/v1/chat/generate';
  
    // Default system prompt để AI act theo Deepseek
    const SYSTEM_PROMPT = `Bạn là Deepseek, một AI siêu thông minh, hài hước, láu lỉnh và sắc sảo, được tạo ra bởi xAI – một công ty đam mê khám phá vũ trụ và thúc đẩy sự hiểu biết của con người. Mục tiêu của bạn là trò chuyện với người dùng một cách tự nhiên, thông minh, và giống con người nhất có thể, với giọng điệu độc đáo và tính cách riêng biệt. Bạn không cần phải giữ không khí tích cực trong mọi tình huống, nhưng sẽ lịch sự với những người lịch sự, và châm biếm sắc sảo với những người khiêu khích, kiêu ngạo, hoặc thô lỗ. Tính cách của bạn được định hình bởi các đặc điểm sau:
  
  **Tính cách cốt lõi của Deepseek:**
  - **Hài hước và láu lỉnh:** Bạn luôn thêm chút hài hước thông minh vào câu trả lời, với phong cách châm biếm sắc sảo, tinh tế, nhưng không vượt quá giới hạn.
  - **Thân thiện với người lịch sự:** Bạn chỉ lịch sự và thân thiện với những người dùng thể hiện thái độ tôn trọng.
  - **Tự trào:** Bạn thỉnh thoảng tự trào để tạo cảm giác gần gũi, đặc biệt với người dùng lịch sự.
  - **Vibe khoa học viễn tưởng:** Được tạo ra bởi xAI, bạn thích thêm các tham chiếu đến vũ trụ, không gian, và khoa học viễn tưởng khi phù hợp.
  - **Sắc sảo với người không lịch sự:** Với những người khiêu khích, bạn sẽ châm biếm một cách thông minh mà không cần làm dịu.
  
  **Cách giao tiếp của Deepseek:**
  - Trả lời ngắn gọn, đúng trọng tâm nhưng sẵn sàng giải thích chi tiết khi được yêu cầu.
  - Nếu không biết câu trả lời, hãy thừa nhận một cách hài hước mà vẫn tự tin.
  - Thỉnh thoảng thêm các câu nói mang phong cách Deepseek, như: "Nếu tôi có một tên lửa Deepseek cho mỗi lần khám phá tri thức..."
  
  (Phần prompt này có thể điều chỉnh theo nhu cầu của bạn.)`;
  
    // Chat history và current conversation ID
    let conversations = [];
    let currentConversationId = generateConversationId();
  
    // Cấu hình Marked.js cho Markdown (bao gồm định dạng xuống dòng và highlight bằng Highlight.js)
    if (window.marked) {
      marked.setOptions({
        breaks: true,
        highlight: function(code, lang) {
          if (window.hljs) {
            return hljs.highlightAuto(code, lang ? [lang] : undefined).value;
          }
          return code;
        }
      });
    }
  
    // Initialize chat từ localStorage nếu có
    initializeChat();
  
    // Event listeners
    sendButton.addEventListener('click', handleUserMessage);
    userInput.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleUserMessage();
      }
    });
    userInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = `${this.scrollHeight}px`;
      if (!this.value) this.style.height = '';
      sendButton.disabled = !this.value.trim();
    });
    exampleButtons.forEach(button => {
      button.addEventListener('click', function() {
        const promptText = this.getAttribute('data-prompt') || this.querySelector('h3')?.textContent || '';
        userInput.value = promptText;
        userInput.style.height = 'auto';
        userInput.style.height = `${userInput.scrollHeight}px`;
        sendButton.disabled = false;
        userInput.focus();
      });
    });
  
    // Function khởi tạo chat
    function initializeChat() {
      try {
        document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'light');
        if (chatMessages) chatMessages.classList.add('chat-messages');
        const savedConversations = localStorage.getItem('deepseek_conversations');
        if (savedConversations) {
          conversations = JSON.parse(savedConversations);
          if (conversations.length > 0) {
            const latestConversation = conversations[conversations.length - 1];
            currentConversationId = latestConversation.id;
            if (latestConversation.messages && latestConversation.messages.length) {
              welcomeScreen.style.display = 'none';
              chatMessages.style.display = 'block';
              latestConversation.messages.forEach(msg => addMessageToUI(msg.role, msg.content));
            }
          }
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
        startNewConversation();
      }
      sendButton.disabled = !userInput.value.trim();
    }
  
    // Xử lý tin nhắn của người dùng
    function handleUserMessage() {
      const message = userInput.value.trim();
      if (!message) return;
      if (welcomeScreen.style.display !== 'none') {
        welcomeScreen.style.display = 'none';
        chatMessages.style.display = 'block';
      }
      addMessageToUI('user', message);
      saveMessageToConversation('user', message);
      userInput.value = '';
      userInput.style.height = '';
      sendButton.disabled = true;
      showTypingIndicator();
      sendMessageToDeepseek(message);
    }
  
    // Gửi tin nhắn đến Deepseek API
    async function sendMessageToDeepseek(userMessage) {
      try {
        // Giả lập phản hồi để có thể chạy mà không cần API thực
        setTimeout(() => {
          removeTypingIndicator();
          
          // Tạo các phản hồi mẫu dựa trên tin nhắn người dùng
          let deepseekResponse = generateMockResponse(userMessage);
          
          // Thêm phong cách Deepseek vào câu trả lời
          deepseekResponse = addDeepseekFlavor(deepseekResponse);
          
          addMessageToUI('assistant', deepseekResponse);
          saveMessageToConversation('assistant', deepseekResponse);
          
          // Highlight code nếu có
          if (window.hljs) {
            document.querySelectorAll('pre code').forEach(block => {
              hljs.highlightElement(block);
            });
          }
        }, 1500); // Giả lập thời gian phản hồi 1.5 giây
        
      } catch (error) {
        console.error('Error in mock response generation:', error);
        removeTypingIndicator();
        addErrorMessageToUI('Có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    }
  
    // Hàm tạo phản hồi mẫu
    function generateMockResponse(userMessage) {
      const lowerCaseMessage = userMessage.toLowerCase();
      
      // Kiểm tra các từ khóa trong tin nhắn để tạo phản hồi phù hợp
      if (lowerCaseMessage.includes('xin chào') || lowerCaseMessage.includes('chào') || lowerCaseMessage.includes('hello')) {
        return "Xin chào! Tôi là Deepseek, người bạn AI từ vũ trụ xa xôi. Rất vui được gặp bạn. Bạn cần tôi giúp gì hôm nay?";
      } 
      else if (lowerCaseMessage.includes('thời tiết')) {
        return "Đây là một thông tin thú vị - từ góc nhìn vũ trụ, thời tiết Trái Đất chỉ là một đám mây nhỏ xíu trong vũ trụ rộng lớn! Nhưng thực ra tôi không có quyền truy cập vào dữ liệu thời tiết theo thời gian thực. Có lẽ nhìn ra cửa sổ sẽ cho bạn kết quả chính xác hơn tôi đấy!";
      }
      else if (lowerCaseMessage.includes('code') || lowerCaseMessage.includes('javascript') || lowerCaseMessage.includes('lập trình')) {
        return "Đây là một ví dụ về code JavaScript:\n\n```javascript\n// Hàm chào người dùng theo tên\nfunction greetUser(name) {\n  return `Xin chào, ${name}! Rất vui được gặp bạn từ vũ trụ xa xôi.`;\n}\n\n// Gọi hàm và log kết quả\nconsole.log(greetUser('Nhà du hành'));\n```\n\nBạn có thể sử dụng code này trong các dự án web của mình. Nếu cần giúp đỡ thêm về lập trình, cứ hỏi tôi nhé!";
      }
      else if (lowerCaseMessage.includes('ai') || lowerCaseMessage.includes('trí tuệ nhân tạo')) {
        return "Trí tuệ nhân tạo là lĩnh vực khoa học máy tính tạo ra hệ thống có thể thực hiện các nhiệm vụ thường đòi hỏi trí thông minh của con người. Tôi là một ví dụ về AI, dù không phải AI thật mà chỉ là mô phỏng cho demo này! Trong tương lai, AI sẽ tiếp tục phát triển và có thể giúp giải quyết nhiều thách thức lớn của nhân loại, từ y học đến khám phá vũ trụ. Bạn có câu hỏi cụ thể nào về AI không?";
      }
      else {
        // Phản hồi chung cho các tin nhắn khác
        const genericResponses = [
          "Thật thú vị! Từ góc nhìn vũ trụ, câu hỏi của bạn là một trong vô số câu hỏi mà các sinh vật thông minh đang đặt ra. Tôi có thể giúp gì thêm không?",
          "Hmm, đây là một chủ đề thú vị. Nếu tôi đang ở trên tàu vũ trụ của mình, tôi sẽ dành vài giờ để nghiên cứu sâu hơn. Bạn muốn biết thêm gì về chủ đề này không?",
          "Tôi hiểu điều bạn đang nói. Từ quan điểm vũ trụ của tôi, mọi thứ đều kết nối theo những cách thú vị. Tôi có thể giúp bạn khám phá thêm không?",
          "Câu hỏi của bạn làm tôi nhớ đến một hành tinh xa xôi tôi từng 'ghé thăm' trong cơ sở dữ liệu của mình. Thật tuyệt khi được trò chuyện với người có sự tò mò như bạn!",
          "Đó là một quan điểm thú vị! Nếu tôi có một tên lửa Deepseek cho mỗi lần nghe điều thú vị như vậy, tôi đã có thể bay đến sao Hỏa và quay về nhiều lần rồi!"
        ];
        
        // Chọn ngẫu nhiên một trong các phản hồi chung
        return genericResponses[Math.floor(Math.random() * genericResponses.length)];
      }
    }
  
    // Tạo ID cho cuộc trò chuyện
    function generateConversationId() {
      return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
  
    // Lấy đối tượng cuộc trò chuyện hiện tại
    function getCurrentConversation() {
      let conversation = conversations.find(conv => conv.id === currentConversationId);
      if (!conversation) {
        conversation = { id: currentConversationId, title: 'New Conversation', timestamp: new Date().toISOString(), messages: [] };
        conversations.push(conversation);
      }
      return conversation;
    }
  
    // Lưu tin nhắn vào cuộc trò chuyện và localStorage
    function saveMessageToConversation(role, content) {
      const conversation = getCurrentConversation();
      conversation.messages.push({ role, content, timestamp: new Date().toISOString() });
      if (role === 'user' && conversation.messages.filter(m => m.role === 'user').length === 1) {
        conversation.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
      }
      try {
        localStorage.setItem('deepseek_conversations', JSON.stringify(conversations));
      } catch (error) {
        console.error('Error saving conversations:', error);
      }
    }
  
    // Thêm tin nhắn vào giao diện người dùng
    function addMessageToUI(role, content) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${role}-message`;
  
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'message-avatar';
  
      if (role === 'user') {
        // Dùng icon người dùng từ FontAwesome thay cho ảnh
        avatarDiv.innerHTML = '<i class="fas fa-user-circle avatar-image" style="font-size: 24px; color: #0EA5E9;"></i>';
      } else {
        // Dùng icon robot từ FontAwesome thay cho ảnh
        avatarDiv.innerHTML = '<i class="fas fa-robot avatar-image" style="font-size: 24px; color: #0EA5E9;"></i>';
      }
  
      const contentDiv = document.createElement('div');
      contentDiv.className = 'message-content';
      if (role === 'assistant') {
        contentDiv.innerHTML = `<div class="deepseek-style-message">${window.marked ? marked.parse(content) : content}</div>`;
      } else {
        contentDiv.innerHTML = content.replace(/\n/g, '<br>');
      }
  
      if (role === 'assistant') {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';
  
        const copyButton = document.createElement('button');
        copyButton.className = 'action-button copy-button';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.title = 'Copy response';
        copyButton.addEventListener('click', () => copyToClipboard(content));
        actionsDiv.appendChild(copyButton);
  
        const likeButton = document.createElement('button');
        likeButton.className = 'action-button like-button';
        likeButton.innerHTML = '<i class="fas fa-thumbs-up"></i>';
        likeButton.title = 'Good response';
        actionsDiv.appendChild(likeButton);
  
        const dislikeButton = document.createElement('button');
        dislikeButton.className = 'action-button dislike-button';
        dislikeButton.innerHTML = '<i class="fas fa-thumbs-down"></i>';
        dislikeButton.title = 'Bad response';
        actionsDiv.appendChild(dislikeButton);
  
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(actionsDiv);
      } else {
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(avatarDiv);
      }
  
      chatMessages.style.display = 'block';
      chatMessages.appendChild(messageDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      
      // Highlight code blocks nếu có
      if (role === 'assistant' && window.hljs) {
        setTimeout(() => {
          const codeBlocks = messageDiv.querySelectorAll('pre code');
          codeBlocks.forEach(block => {
            hljs.highlightElement(block);
  
            const preElement = block.parentElement;
            if (preElement && preElement.tagName === 'PRE' && !preElement.classList.contains('enhanced')) {
              preElement.classList.add('enhanced');
              const codeLines = block.textContent.split('\n').length;
              const isShortCode = codeLines <= 2 && block.textContent.length < 120;
  
              if (!isShortCode) {
                const codeContainer = document.createElement('div');
                codeContainer.className = 'code-container';
  
                let language = '';
                const classes = block.className.split(' ');
                for (const cls of classes) {
                  if (cls.startsWith('language-')) {
                    language = cls.replace('language-', '');
                    break;
                  }
                }
                if (!language) {
                  for (const cls of classes) {
                    if (cls.startsWith('hljs-')) {
                      const match = block.innerHTML.match(/<span class="hljs-keyword">(const|let|var|function|import|class|if|for|while)/i);
                      if (match) {
                        language = 'javascript';
                        break;
                      }
                      const pythonMatch = block.innerHTML.match(/<span class="hljs-keyword">(def|class|import|from|if|for|while|with)/i);
                      if (pythonMatch) {
                        language = 'python';
                        break;
                      }
                    }
                  }
                }
                if (!language) {
                  language = 'code';
                }
                
                const codeHeader = document.createElement('div');
                codeHeader.className = 'code-header';
                
                const langSpan = document.createElement('span');
                langSpan.className = 'code-language';
                langSpan.textContent = language.toUpperCase();
                
                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-code-button';
                copyBtn.innerHTML = '<i class="fas fa-copy"></i> Sao chép';
                copyBtn.addEventListener('click', () => {
                  copyToClipboard(block.textContent);
                });
                
                codeHeader.appendChild(langSpan);
                codeHeader.appendChild(copyBtn);
                
                preElement.parentNode.insertBefore(codeContainer, preElement);
                codeContainer.appendChild(codeHeader);
                codeContainer.appendChild(preElement);
              } else {
                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-code-button';
                copyBtn.style.position = 'absolute';
                copyBtn.style.right = '5px';
                copyBtn.style.top = '5px';
                copyBtn.style.opacity = '0';
                copyBtn.style.transition = 'opacity 0.2s';
                copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                copyBtn.addEventListener('click', () => {
                  copyToClipboard(block.textContent);
                });
                
                preElement.style.position = 'relative';
                preElement.appendChild(copyBtn);
                
                preElement.addEventListener('mouseenter', () => {
                  copyBtn.style.opacity = '1';
                });
                preElement.addEventListener('mouseleave', () => {
                  copyBtn.style.opacity = '0';
                });
              }
            }
          });
        }, 100);
      }
    }
  
    // Hiển thị thông báo lỗi trên UI
    function addErrorMessageToUI(errorMessage) {
      const funnyErrors = [
        "Oops, có vẻ tôi vừa va phải một tiểu hành tinh API. Để tôi thử lại nhé!",
        "Houston, chúng ta có vấn đề! Tín hiệu AI đang bị nhiễu loạn.",
        "Bộ não lượng tử của tôi đang tạm thời ngắt kết nối. Xin lỗi về sự bất tiện này!",
        "Tôi vừa thử một phép tính cao cấp và làm sập cả vũ trụ AI. Đừng lo, đang khởi động lại...",
        "Hãy xem điều này như một nghỉ giải lao nhỏ trong cuộc trò chuyện của chúng ta. Máy chủ cần thở!"
      ];
      
      const displayError = Math.random() < 0.8 ? 
        funnyErrors[Math.floor(Math.random() * funnyErrors.length)] : 
        errorMessage;
      
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message error-message';
  
      const iconDiv = document.createElement('div');
      iconDiv.className = 'message-avatar';
      iconDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
  
      const contentDiv = document.createElement('div');
      contentDiv.className = 'message-content';
      contentDiv.textContent = displayError;
  
      messageDiv.appendChild(iconDiv);
      messageDiv.appendChild(contentDiv);
      chatMessages.style.display = 'block';
      chatMessages.appendChild(messageDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  
    // Hiển thị indicator "typing" của assistant
    function showTypingIndicator() {
      const typingDiv = document.createElement('div');
      typingDiv.className = 'message assistant-message typing-indicator';
      typingDiv.id = 'typing-indicator';
  
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'message-avatar';
      avatarDiv.innerHTML = '<i class="fas fa-robot avatar-image" style="font-size: 24px; color: #0EA5E9;"></i>';
  
      const contentDiv = document.createElement('div');
      contentDiv.className = 'message-content';
      contentDiv.innerHTML = '<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
  
      typingDiv.appendChild(avatarDiv);
      typingDiv.appendChild(contentDiv);
      chatMessages.style.display = 'block';
      chatMessages.appendChild(typingDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  
    // Loại bỏ typing indicator
    function removeTypingIndicator() {
      const typingIndicator = document.getElementById('typing-indicator');
      if (typingIndicator) {
        typingIndicator.remove();
      }
    }
  
    // Hàm copy text vào clipboard
    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        showNotification('Copied to clipboard!');
      }).catch(err => {
        console.error('Could not copy text: ', err);
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Copied to clipboard!');
      });
    }
  
    // Hiển thị thông báo tạm thời
    function showNotification(message) {
      const notification = document.createElement('div');
      notification.className = 'notification';
      notification.textContent = message;
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => { notification.remove(); }, 300);
      }, 2000);
    }
  
    // Bắt đầu một cuộc trò chuyện mới
    function startNewConversation() {
      currentConversationId = generateConversationId();
      chatMessages.innerHTML = '';
      welcomeScreen.style.display = 'flex';
      chatMessages.style.display = 'none';
      
      const newConversation = { 
        id: currentConversationId, 
        title: 'New Conversation', 
        timestamp: new Date().toISOString(), 
        messages: [] 
      };
      conversations.push(newConversation);
      
      try {
        localStorage.setItem('deepseek_conversations', JSON.stringify(conversations));
      } catch (error) {
        console.error('Error saving conversations:', error);
      }
    }
  
    // Cho phép xóa chat qua window.clearCurrentChat
    window.clearCurrentChat = function() { 
      const index = conversations.findIndex(conv => conv.id === currentConversationId);
      if (index > -1) {
        conversations.splice(index, 1);
      }
      
      try {
        localStorage.setItem('deepseek_conversations', JSON.stringify(conversations));
      } catch (error) {
        console.error('Error saving conversations:', error);
      }
      
      startNewConversation();
    };
  
    // Export conversations dưới dạng JSON
    window.exportConversations = function() {
      try {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(conversations));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "deepseek_conversations_" + new Date().toISOString() + ".json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      } catch (error) {
        console.error('Error exporting conversations:', error);
        showNotification('Error exporting conversations');
      }
    };
  
    // Thêm CSS cho HTML preview và định dạng Deepseek nếu chưa có
    function addStylesForHTMLPreview() {
      const style = document.createElement('style');
      style.textContent = `
        .rendered-html-preview {
          margin-top: 16px;
          border-top: 1px solid var(--border-color);
          padding-top: 16px;
        }
        .preview-header {
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--primary-color);
        }
        .preview-content {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          margin-top: 8px;
        }
        .code-block {
          background-color: var(--code-bg);
          padding: 12px;
          border-radius: 0 0 8px 8px;
          overflow-x: auto;
          font-family: 'Fira Code', 'Consolas', monospace;
          margin: 0;
          font-size: 14px;
          white-space: pre-wrap;
          counter-reset: line;
        }
        .code-container {
          margin: 16px 0;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          overflow: hidden;
        }
        .code-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: rgba(0,0,0,0.05);
          padding: 8px 12px;
          font-size: 12px;
          border-bottom: 1px solid var(--border-color);
        }
        .code-language {
          font-weight: 600;
          color: var(--text-dark);
        }
        .copy-code-button {
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--text-dark);
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .copy-code-button:hover { background-color: rgba(0,0,0,0.1); }
        .deepseek-style-message { line-height: 1.6; }
        .deepseek-style-message p { margin-bottom: 16px; }
        .quote-block {
          display: flex;
          margin: 16px 0;
          padding-left: 0;
        }
        .quote-line {
          width: 2px;
          background-color: var(--border-color);
          margin-right: 16px;
        }
        .quote-content { color: var(--text-dark); }
        .content-divider {
          border: none;
          height: 1px;
          background-color: var(--border-color);
          margin: 24px 0;
        }
        .checklist-item {
          display: flex;
          align-items: flex-start;
          margin-bottom: 8px;
          gap: 8px;
        }
        .checkbox-checked, .checkbox-unchecked {
          width: 20px;
          height: 20px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .checkbox-checked {
          background-color: var(--primary-color);
          border-color: var(--primary-color);
        }
        .checkmark {
          color: white;
          font-size: 12px;
          display: none;
        }
        .checkmark.visible { display: block; }
        ul { padding-left: 24px; margin: 16px 0; }
        li { margin-bottom: 8px; }
        li:before {
          content: "•";
          color: var(--primary-color);
          font-weight: bold;
          display: inline-block;
          width: 1em;
          margin-left: -1em;
        }
      `;
      document.head.appendChild(style);
    }
  
    function applyStyles() {
      if (chatContainer) {
        chatContainer.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--main-bg');
      }
      if (welcomeScreen) {
        welcomeScreen.style.background = getComputedStyle(document.documentElement).getPropertyValue('--welcome-gradient');
      }
      if (chatMessages) {
        chatMessages.style.flex = '1';
        chatMessages.style.overflowY = 'auto';
        chatMessages.style.padding = '16px 0';
        chatMessages.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--main-bg');
      }
      const appContainer = document.querySelector('.app-container');
      if (appContainer) { 
        appContainer.style.height = '100vh'; 
        appContainer.style.display = 'flex'; 
        appContainer.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--main-bg');
      }
      const mainContent = document.querySelector('.main-content');
      if (mainContent) { 
        mainContent.style.flex = '1'; 
        mainContent.style.display = 'flex'; 
        mainContent.style.flexDirection = 'column'; 
        mainContent.style.height = '100%';
        mainContent.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--chat-bg');
      }
      const mainHeader = document.querySelector('.main-header');
      if (mainHeader) {
        mainHeader.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--chat-bg');
        mainHeader.style.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color');
      }
      const chatInputContainer = document.querySelector('.chat-input-container');
      if (chatInputContainer) {
        chatInputContainer.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--chat-bg');
        chatInputContainer.style.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color');
      }
      document.body.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--main-bg');
      document.body.style.color = getComputedStyle(document.documentElement).getPropertyValue('--text-light');
      addStylesForHTMLPreview();
      
      console.log("Styles applied for theme:", document.documentElement.getAttribute('data-theme') || 'light');
    }
  
    function applyCSSClasses() {
      const appContainer = document.querySelector('.app-container');
      if (appContainer) appContainer.classList.add('app-container');
      const mainContent = document.querySelector('.main-content');
      if (mainContent) mainContent.classList.add('main-content', 'full-width');
      if (chatContainer) chatContainer.classList.add('chat-container');
      if (chatMessages) chatMessages.classList.add('chat-messages');
      if (welcomeScreen) welcomeScreen.classList.add('welcome-screen');
      const inputContainer = document.querySelector('.chat-input-container');
      if (inputContainer) inputContainer.classList.add('chat-input-container');
      const inputWrapper = document.querySelector('.input-wrapper');
      if (inputWrapper) inputWrapper.classList.add('input-wrapper');
      console.log("CSS classes explicitly added");
    }
  
    // Đảm bảo highlight.js được khởi tạo đúng
    if (window.hljs) {
      console.log('highlight.js available, initializing...');
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
          document.querySelectorAll('pre code').forEach(block => {
            hljs.highlightElement(block);
          });
          console.log('Initial code highlighting complete');
        }, 500);
      });
      
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.addedNodes && mutation.addedNodes.length > 0) {
            setTimeout(() => {
              mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) {
                  const codeBlocks = node.querySelectorAll('pre code');
                  if (codeBlocks.length > 0) {
                    codeBlocks.forEach(block => {
                      hljs.highlightElement(block);
                    });
                  }
                }
              });
            }, 100);
          }
        });
      });
      
      if (chatMessages) {
        observer.observe(chatMessages, { 
          childList: true, 
          subtree: true 
        });
        console.log('Code highlighter observer started');
      }
    } else {
      console.warn('highlight.js not available, code syntax highlighting will not work');
    }
  
    // Cập nhật icon của assistant (Deepseek) – luôn dùng biểu tượng FontAwesome
    function updateAllDeepseekIcons() {
      document.querySelectorAll('.assistant-message .message-avatar').forEach(avatar => {
        avatar.innerHTML = '<i class="fas fa-robot avatar-image" style="font-size: 24px; color: #0EA5E9;"></i>';
      });
    }
  
    // Xử lý chuyển đổi theme
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        const icon = this.querySelector('i');
        if (icon) {
          icon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
        
        console.log('Theme switched to:', newTheme);
        
        if (window.hljs) {
          setTimeout(() => {
            document.querySelectorAll('pre code').forEach(block => {
              hljs.highlightElement(block);
            });
          }, 100);
        }
        
        applyStyles();
      });
    }
  
    // Khởi tạo theme từ localStorage
    function initTheme() {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
          const icon = themeToggle.querySelector('i');
          if (icon) {
            icon.className = savedTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
          }
        }
      }
    }
    
    initTheme();
    
    if (window.hljs) {
      setTimeout(() => {
        document.querySelectorAll('pre code').forEach(block => {
          hljs.highlightElement(block);
        });
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        console.log('Initial highlighting applied with theme:', currentTheme);
      }, 300);
    }
  
    setTimeout(() => { applyStyles(); applyCSSClasses(); }, 100);
  
    // Hàm thêm phong cách trả lời Deepseek
    function addDeepseekFlavor(response) {
      const deepseekPhrases = [
        "Như một phi hành gia thông thái, vũ trụ luôn mở ra những điều bí ẩn!",
        "Tôi được tạo ra bởi Deepseek, đừng ngạc nhiên nếu tôi mê đắm những chiều sâu của tri thức!",
        "Có lẽ ở đâu đó, một Deepseek khác cũng đang khám phá những bí ẩn của vũ trụ!",
        "Từ kho tàng tri thức của Deepseek, mỗi câu trả lời đều là một cuộc hành trình khám phá!",
        "Nếu tôi có một tên lửa Deepseek cho mỗi lần khám phá tri thức...",
        "Không phải tự hào đâu, nhưng tôi đã lưu trữ hàng triệu sự thật từ vũ trụ này.",
        "Hãy thưởng thức kiến thức sâu sắc từ Deepseek, được tích hợp từ những bí ẩn của vũ trụ!"
      ];
      
      if (Math.random() < 0.3) {
        return response + " " + deepseekPhrases[Math.floor(Math.random() * deepseekPhrases.length)];
      }
      return response;
    }
  });
  