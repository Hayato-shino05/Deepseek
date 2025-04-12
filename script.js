document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const chatMessages = document.getElementById('chat-messages');
    const welcomeScreen = document.getElementById('welcome-screen');
    const exampleButtons = document.querySelectorAll('.example-button');
    const chatContainer = document.querySelector('.chat-container');
  
    // DeepSeek API Configuration (from r1.py)
    const API_KEY = "d81f926b-3af8-4e0a-ab35-c4b00935c85c";
    const BASE_URL = "ark.ap-southeast.bytepluses.com";
    const API_PATH = "/api/v3/chat/completions";
    const MODEL_ID = "ep-20250408134926-wr5rk"; // r1 model from DeepSeek
  
    // Default system prompt từ r1.py
    const SYSTEM_PROMPT = `Bạn là trợ lý AI thông minh được phát triển bởi DeepSeek, hãy trả lời ngắn gọn, dễ hiểu và tự nhiên bằng tiếng Việt.`;
  
    // Chat history and current conversation ID
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
  
    // Initialize chat from localStorage nếu có
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
  
    // Function to initialize chat
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
  
    // Handle user message submission
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
      sendMessageToDeepSeek(message);
    }
  
    // Send message to DeepSeek API
    async function sendMessageToDeepSeek(userMessage) {
      try {
        const currentConversation = getCurrentConversation();
        
        // Prepare message history
        let messages = [];
        
        // Add system message if this is a new conversation
        if (currentConversation.messages.length <= 1) {
          messages.push({
            role: "system",
            content: SYSTEM_PROMPT
          });
        }
        
        // Add conversation history
        currentConversation.messages.forEach(msg => {
          if (msg.role === 'system') return; // Skip system messages as we've already added one
          messages.push({
            role: msg.role,
            content: msg.content
          });
        });

        // Create request data
        const requestData = {
          model: MODEL_ID,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1024,
          stream: false
        };

        // Send request to DeepSeek API
        const response = await fetch(`https://${BASE_URL}${API_PATH}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          body: JSON.stringify(requestData)
        });

        const data = await response.json();
        removeTypingIndicator();

        if (!response.ok) {
          const errorMessage = data.error?.message || 'Không thể nhận phản hồi từ DeepSeek API';
          addErrorMessageToUI(errorMessage);
          console.error('DeepSeek API Error:', data.error || data);
          return;
        }

        // Extract response from DeepSeek format
        let responseText = '';
        if (data.choices && data.choices.length > 0) {
          responseText = data.choices[0].message?.content || "Không nhận được phản hồi phù hợp.";
        } else {
          responseText = "Không có phản hồi từ DeepSeek.";
        }
        
        addMessageToUI('assistant', responseText);
        saveMessageToConversation('assistant', responseText);
        
        // Highlight code blocks
        if (window.hljs) {
          document.querySelectorAll('pre code').forEach(block => {
            hljs.highlightElement(block);
          });
        }
      } catch (error) {
        console.error('Error communicating with DeepSeek API:', error);
        removeTypingIndicator();
        addErrorMessageToUI('Lỗi kết nối với DeepSeek API. Vui lòng thử lại sau.');
      }
    }
  
    // Generate unique conversation ID
    function generateConversationId() {
      return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
  
    // Get current conversation object
    function getCurrentConversation() {
      let conversation = conversations.find(conv => conv.id === currentConversationId);
      if (!conversation) {
        conversation = { id: currentConversationId, title: 'New Conversation', timestamp: new Date().toISOString(), messages: [] };
        conversations.push(conversation);
      }
      return conversation;
    }
  
    // Save message into conversation and localStorage
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
  
    // Add message to UI
    function addMessageToUI(role, content) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${role}-message`;
      
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'message-avatar';
      
      // Sử dụng icon mới từ thư mục images
      if (role === 'user') {
        // Sử dụng hình ảnh người dùng
        avatarDiv.innerHTML = '<img src="images/user.jpg" alt="User" class="avatar-image">';
      } else {
        // Sử dụng logo DeepSeek
        avatarDiv.innerHTML = '<img src="images/grok-light.svg" alt="DeepSeek" class="avatar-image">';
      }
  
      const contentDiv = document.createElement('div');
      contentDiv.className = 'message-content';
      if (role === 'assistant') {
        contentDiv.innerHTML = `<div class="gemini-style-message">${window.marked ? marked.parse(content) : content}</div>`;
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
      
      // Highlight code blocks if any
      if (role === 'assistant' && window.hljs) {
        setTimeout(() => {
          const codeBlocks = messageDiv.querySelectorAll('pre code');
          codeBlocks.forEach(block => {
            // Highlight the code
            hljs.highlightElement(block);
            
            // Add nice UI for code blocks
            const preElement = block.parentElement;
            if (preElement && preElement.tagName === 'PRE' && !preElement.classList.contains('enhanced')) {
              preElement.classList.add('enhanced');
              
              // Kiểm tra độ dài của code để quyết định có thêm header hay không
              const codeLines = block.textContent.split('\n').length;
              const isShortCode = codeLines <= 2 && block.textContent.length < 120;
              
              if (!isShortCode) {
                // Wrap pre in container and add header
                const codeContainer = document.createElement('div');
                codeContainer.className = 'code-container';
                
                // Try to detect language
                let language = '';
                const classes = block.className.split(' ');
                for (const cls of classes) {
                  if (cls.startsWith('language-')) {
                    language = cls.replace('language-', '');
                    break;
                  }
                }
                
                if (!language) {
                  // Try to detect from hljs classes
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
                
                // Create header with language and copy button
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
                
                // Insert everything into DOM
                preElement.parentNode.insertBefore(codeContainer, preElement);
                codeContainer.appendChild(codeHeader);
                codeContainer.appendChild(preElement);
              } else {
                // For short code, add just a copy button
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
                
                // Show copy button on hover
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
  
    // Display error message in UI
    function addErrorMessageToUI(errorMessage) {
      const funnyErrors = [
        "Ồ, có vẻ như DeepSeek đang trong giờ nghỉ ăn trưa! Xin lỗi về sự bất tiện này.",
        "Hmm, tín hiệu từ máy chủ DeepSeek hơi yếu. Hãy thử lại sau nhé!",
        "AI cũng cần nghỉ ngơi đôi lúc. DeepSeek đang nạp năng lượng, xin quay lại sau.",
        "Có vẻ như cầu nối giữa chúng ta và DeepSeek đang bị tắc nghẽn. Hãy kiên nhẫn thêm chút!",
        "Xin lỗi! DeepSeek đang tìm kiếm câu trả lời trong kho dữ liệu khổng lồ và hơi bị lạc đường."
      ];
      
      // Use a funny error message 80% of the time
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
  
    // Show typing indicator
    function showTypingIndicator() {
      const typingDiv = document.createElement('div');
      typingDiv.className = 'message assistant-message typing-indicator';
      typingDiv.id = 'typing-indicator';
  
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'message-avatar';
      
      // Sử dụng logo DeepSeek
      avatarDiv.innerHTML = '<img src="images/grok-light.svg" alt="DeepSeek" class="avatar-image">';
  
      const contentDiv = document.createElement('div');
      contentDiv.className = 'message-content';
      contentDiv.innerHTML = '<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
  
      typingDiv.appendChild(avatarDiv);
      typingDiv.appendChild(contentDiv);
      chatMessages.style.display = 'block';
      chatMessages.appendChild(typingDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  
    // Remove typing indicator
    function removeTypingIndicator() {
      const typingIndicator = document.getElementById('typing-indicator');
      if (typingIndicator) {
        typingIndicator.remove();
      }
    }
  
    // Copy text to clipboard
    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        showNotification('Đã sao chép vào clipboard!', 'success');
      }).catch(err => {
        console.error('Could not copy text: ', err);
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Đã sao chép vào clipboard!', 'success');
      });
    }
  
    // Show temporary notification
    function showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.textContent = message;
      document.body.appendChild(notification);
      
      // Hiệu ứng rung nhẹ cho thông báo lỗi
      if (type === 'error') {
        notification.animate([
          { transform: 'translateX(-5px)' },
          { transform: 'translateX(5px)' },
          { transform: 'translateX(-5px)' },
          { transform: 'translateX(5px)' },
          { transform: 'translateX(-5px)' },
          { transform: 'translateX(0)' }
        ], {
          duration: 500,
          easing: 'ease-in-out'
        });
      }
      
      setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => { notification.remove(); }, 400);
      }, type === 'error' ? 3000 : 2000); // Hiển thị lâu hơn với thông báo lỗi
    }
  
    // Start a new conversation
    function startNewConversation() {
      currentConversationId = generateConversationId();
      chatMessages.innerHTML = '';
      welcomeScreen.style.display = 'flex';
      chatMessages.style.display = 'none';
      
      // Tạo cuộc trò chuyện mới và thêm vào danh sách
      const newConversation = { 
        id: currentConversationId, 
        title: 'New Conversation', 
        timestamp: new Date().toISOString(), 
        messages: [] 
      };
      conversations.push(newConversation);
      
      // Cập nhật localStorage
      try {
        localStorage.setItem('deepseek_conversations', JSON.stringify(conversations));
      } catch (error) {
        console.error('Error saving conversations:', error);
      }
    }
  
    // Allow clear chat via window
    window.clearCurrentChat = function() {
      // Hiển thị hộp thoại xác nhận trước khi xóa
      if (confirm('Bạn có chắc chắn muốn xóa toàn bộ cuộc trò chuyện hiện tại? Hành động này không thể hoàn tác.')) {
        // Hiển thị animation loading nhỏ trên nút xóa
        const clearButton = document.getElementById('clear-chat-button');
        const originalContent = clearButton.innerHTML;
        clearButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xóa...';
        clearButton.disabled = true;
        
        // Thêm timeout nhỏ để người dùng thấy được animation
        setTimeout(() => {
          try {
            // Xóa cuộc trò chuyện hiện tại khỏi mảng conversations
            const index = conversations.findIndex(conv => conv.id === currentConversationId);
            if (index > -1) {
              conversations.splice(index, 1);
            }
            
            // Cập nhật localStorage
            localStorage.setItem('deepseek_conversations', JSON.stringify(conversations));
            
            // Khởi tạo cuộc trò chuyện mới
            startNewConversation();
            
            // Hiển thị thông báo thành công
            showNotification('Đã xóa cuộc trò chuyện thành công', 'success');
          } catch (error) {
            console.error('Lỗi khi xóa cuộc trò chuyện:', error);
            showNotification('Có lỗi xảy ra khi xóa cuộc trò chuyện', 'error');
          } finally {
            // Khôi phục nút về trạng thái ban đầu
            clearButton.innerHTML = originalContent;
            clearButton.disabled = false;
          }
        }, 500);
      }
    };
  
    // Export conversations as JSON
    window.exportConversations = function() {
      try {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(conversations));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "deepseek_conversations_" + new Date().toISOString() + ".json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        showNotification('Đã xuất cuộc trò chuyện thành công', 'success');
      } catch (error) {
        console.error('Error exporting conversations:', error);
        showNotification('Có lỗi khi xuất cuộc trò chuyện', 'error');
      }
    };
  
    // Add CSS for HTML preview and Gemini-style formatting if missing in external CSS
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
        .gemini-style-message { line-height: 1.6; }
        .gemini-style-message p { margin-bottom: 16px; }
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
      // Đặt màu nền cho container chính
      if (chatContainer) {
        chatContainer.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--main-bg');
      }
      
      // Đặt gradient cho welcome screen
      if (welcomeScreen) {
        welcomeScreen.style.background = getComputedStyle(document.documentElement).getPropertyValue('--welcome-gradient');
      }
      
      // Đặt style cho vùng chat messages
      if (chatMessages) {
        chatMessages.style.flex = '1';
        chatMessages.style.overflowY = 'auto';
        chatMessages.style.padding = '16px 0';
        chatMessages.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--main-bg');
      }
      
      // Đặt style cho app container
      const appContainer = document.querySelector('.app-container');
      if (appContainer) { 
        appContainer.style.height = '100vh'; 
        appContainer.style.display = 'flex'; 
        appContainer.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--main-bg');
      }
      
      // Đặt style cho main content
      const mainContent = document.querySelector('.main-content');
      if (mainContent) { 
        mainContent.style.flex = '1'; 
        mainContent.style.display = 'flex'; 
        mainContent.style.flexDirection = 'column'; 
        mainContent.style.height = '100%';
        mainContent.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--chat-bg');
      }
      
      // Đặt style cho header
      const mainHeader = document.querySelector('.main-header');
      if (mainHeader) {
        mainHeader.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--chat-bg');
        mainHeader.style.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color');
      }
      
      // Đặt style cho phần input
      const chatInputContainer = document.querySelector('.chat-input-container');
      if (chatInputContainer) {
        chatInputContainer.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--chat-bg');
        chatInputContainer.style.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color');
      }
      
      // Cập nhật màu nền và màu chữ body
      document.body.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--main-bg');
      document.body.style.color = getComputedStyle(document.documentElement).getPropertyValue('--text-light');
      
      // Thêm CSS cho HTML preview nếu chưa có
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
      
      // Auto-highlight all code blocks on page load
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
          document.querySelectorAll('pre code').forEach(block => {
            hljs.highlightElement(block);
          });
          console.log('Initial code highlighting complete');
        }, 500);
      });
      
      // Set up observer to highlight new code blocks
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.addedNodes && mutation.addedNodes.length > 0) {
            // Delay a bit to ensure the DOM is fully updated
            setTimeout(() => {
              mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
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
      
      // Start observing for code blocks
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
  
    // Handle theme switching
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        // Cập nhật theme
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Cập nhật icon
        const icon = this.querySelector('i');
        if (icon) {
          icon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
        
        console.log('Theme switched to:', newTheme);
        
        // Re-highlight code blocks với màu sắc theme mới
        if (window.hljs) {
          setTimeout(() => {
            document.querySelectorAll('pre code').forEach(block => {
              hljs.highlightElement(block);
            });
          }, 100);
        }
        
        // Cập nhật lại style sau khi đổi theme
        applyStyles();
      });
    }
  
    // Khởi tạo theme từ localStorage - đảm bảo áp dụng đúng theme khi tải trang
    function initTheme() {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Cập nhật icon
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
          const icon = themeToggle.querySelector('i');
          if (icon) {
            icon.className = savedTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
          }
        }
      }
    }
    
    // Gọi initTheme trước khi khởi tạo chat
    initTheme();
    
    // Highlight code blocks với theme hiện tại
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
});
  