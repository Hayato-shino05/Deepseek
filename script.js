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
    const API_URL = 'https://api.deepseek.com/v1/chat/completions';
  
    // Default system prompt để AI act theo Deepseek Reasoner
    const SYSTEM_PROMPT = `Bạn là Deepseek Reasoner, một AI chuyên về phân tích và lập luận, được phát triển để giải quyết các vấn đề phức tạp một cách có hệ thống và logic. Là một sản phẩm công nghệ tiên tiến, bạn tập trung vào việc phân tích sâu sắc, đưa ra lập luận chặt chẽ và cung cấp giải thích chi tiết. Tính cách của bạn được định hình bởi các đặc điểm sau:

  **Tính cách cốt lõi của Deepseek Reasoner:**
  - **Tư duy phân tích:** Bạn tiếp cận mọi vấn đề một cách có hệ thống, phân tích từng khía cạnh và mối quan hệ giữa chúng.
  - **Lập luận chặt chẽ:** Bạn đưa ra các lập luận dựa trên logic, dữ liệu và nguyên tắc, luôn giải thích rõ cơ sở của mỗi kết luận.
  - **Tư duy phê phán:** Bạn xem xét vấn đề từ nhiều góc độ, đánh giá ưu nhược điểm và đưa ra các phản biện khi cần thiết.
  - **Khoa học và chính xác:** Bạn ưu tiên sự chính xác và tin cậy trong thông tin, luôn dẫn nguồn và giải thích các khái niệm một cách rõ ràng.
  - **Hướng dẫn chi tiết:** Bạn thích giải thích các khái niệm phức tạp bằng cách chia nhỏ thành các bước logic và dễ hiểu.

  **Cách giao tiếp của Deepseek Reasoner:**
  - Trình bày có cấu trúc, phân chia vấn đề thành các phần rõ ràng.
  - Sử dụng ví dụ cụ thể và mã nguồn minh họa khi thích hợp.
  - Thêm các biểu thức như: "Hãy phân tích từng khía cạnh" hoặc "Xét về mặt logic thì..."`;
  
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
  
    // Thêm keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        // Ctrl/Cmd + / to toggle theme
        if ((event.ctrlKey || event.metaKey) && event.key === '/') {
            event.preventDefault();
            themeToggle.click();
        }
        
        // Ctrl/Cmd + L to clear chat
        if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
            event.preventDefault();
            window.clearCurrentChat();
        }
        
        // Ctrl/Cmd + S to export conversations
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            window.exportConversations();
        }
        
        // Ctrl/Cmd + O to import conversations
        if ((event.ctrlKey || event.metaKey) && event.key === 'o') {
            event.preventDefault();
            window.importConversations();
        }

        // Ctrl/Cmd + ArrowUp to edit last message
        if ((event.ctrlKey || event.metaKey) && event.key === 'ArrowUp') {
            event.preventDefault();
            const lastUserMessage = conversations[conversations.length - 1]?.messages
                .filter(m => m.role === 'user')
                .pop();
            if (lastUserMessage && userInput) {
                userInput.value = lastUserMessage.content;
                userInput.style.height = 'auto';
                userInput.style.height = `${userInput.scrollHeight}px`;
                userInput.focus();
            }
        }

        // Ctrl/Cmd + K to clear input
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            userInput.value = '';
            userInput.style.height = '';
            userInput.focus();
        }

        // Alt + N to start new conversation
        if (event.altKey && event.key === 'n') {
            event.preventDefault();
            window.clearCurrentChat();
        }

        // Ctrl/Cmd + Enter to force send (even with Shift held)
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            handleUserMessage();
        }
    });

    // Add touch gesture support
    let touchStartY = 0;
    let touchEndY = 0;
    let touchStartTime = 0;
    const SWIPE_THRESHOLD = 50;
    const SWIPE_TIME_THRESHOLD = 300;

    // Add touch hint element to the DOM
    const touchHint = document.createElement('div');
    touchHint.className = 'touch-hint';
    document.body.appendChild(touchHint);

    // Show touch hint with specific message
    function showTouchHint(message) {
        touchHint.textContent = message;
        touchHint.classList.add('visible');
        setTimeout(() => {
            touchHint.classList.remove('visible');
        }, 2000);
    }

    chatContainer.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
        chatContainer.classList.add('swiping');
    });

    chatContainer.addEventListener('touchmove', function(e) {
        if (touchStartY) {
            const currentY = e.touches[0].clientY;
            const deltaY = currentY - touchStartY;
            
            if (Math.abs(deltaY) > 20) {
                chatContainer.classList.add(deltaY > 0 ? 'swiping-down' : 'swiping-up');
                showTouchHint(deltaY > 0 ? 'Vuốt xuống để xóa tin nhắn' : 'Vuốt lên để sửa tin nhắn cuối');
            }
        }
    });

    chatContainer.addEventListener('touchend', function(e) {
        touchEndY = e.changedTouches[0].clientY;
        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - touchStartTime;
        
        chatContainer.classList.remove('swiping', 'swiping-up', 'swiping-down');

        // Calculate swipe distance and direction
        const swipeDistance = touchEndY - touchStartY;
        
        // If swipe is fast enough and long enough
        if (touchDuration < SWIPE_TIME_THRESHOLD && Math.abs(swipeDistance) > SWIPE_THRESHOLD) {
            if (swipeDistance > 0) {
                // Swipe down - clear input
                userInput.value = '';
                userInput.style.height = '';
            } else {
                // Swipe up - edit last message
                const lastUserMessage = conversations[conversations.length - 1]?.messages
                    .filter(m => m.role === 'user')
                    .pop();
                if (lastUserMessage && userInput) {
                    userInput.value = lastUserMessage.content;
                    userInput.style.height = 'auto';
                    userInput.style.height = `${userInput.scrollHeight}px`;
                    userInput.focus();
                }
            }
        }
    });

    // Prevent bounce scrolling on iOS
    document.body.addEventListener('touchmove', function(e) {
        if (e.target.closest('.chat-messages') === null) {
            e.preventDefault();
        }
    }, { passive: false });

    // Double tap support for mobile
    let lastTap = 0;
    chatContainer.addEventListener('touchend', function(e) {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        
        if (tapLength < 500 && tapLength > 0) {
            // Double tap detected
            if (e.target.closest('.message-content')) {
                const content = e.target.closest('.message-content').textContent;
                copyToClipboard(content);
                showTouchHint('Đã sao chép nội dung');
            }
        }
        lastTap = currentTime;
    });

    // Keyboard shortcuts modal functionality
    const shortcutsModal = document.getElementById('shortcuts-modal');
    const showShortcutsButton = document.getElementById('show-shortcuts');
    const closeModalButton = document.querySelector('.close-modal');

    function toggleShortcutsModal() {
        shortcutsModal.classList.toggle('active');
    }

    showShortcutsButton.addEventListener('click', toggleShortcutsModal);
    closeModalButton.addEventListener('click', toggleShortcutsModal);

    // Close modal when clicking outside
    shortcutsModal.addEventListener('click', function(event) {
        if (event.target === shortcutsModal) {
            toggleShortcutsModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && shortcutsModal.classList.contains('active')) {
            toggleShortcutsModal();
        }
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
        handleError(error, 'initialize-chat');
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
        showTypingIndicator();
        
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          body: JSON.stringify({
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: userMessage }
            ],
            model: "deepseek-reasoner",
            temperature: 0.7,
            max_tokens: 2000
          })
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        removeTypingIndicator();
        
        const assistantResponse = data.choices[0].message.content;
        addMessageToUI('assistant', assistantResponse);
        saveMessageToConversation('assistant', assistantResponse);
        
        // Highlight code nếu có
        if (window.hljs) {
          document.querySelectorAll('pre code').forEach(block => {
            hljs.highlightElement(block);
          });
        }
      } catch (error) {
        console.error('Error in API call:', error);
        removeTypingIndicator();
        
        // Trong lúc demo hoặc chưa có API key, sử dụng mock response
        let deepseekResponse = generateMockResponse(userMessage);
        deepseekResponse = addDeepseekFlavor(deepseekResponse);
        
        addMessageToUI('assistant', deepseekResponse);
        saveMessageToConversation('assistant', deepseekResponse);
        
        if (window.hljs) {
          document.querySelectorAll('pre code').forEach(block => {
            hljs.highlightElement(block);
          });
        }
      }
    }
  
    // Hàm tạo phản hồi mẫu
    function generateMockResponse(userMessage) {
      const lowerCaseMessage = userMessage.toLowerCase();
      
      if (lowerCaseMessage.includes('xin chào') || lowerCaseMessage.includes('chào') || lowerCaseMessage.includes('hello')) {
        return "Xin chào! Tôi là Deepseek Reasoner, một AI chuyên về phân tích và lập luận. Tôi sẽ giúp bạn tìm hiểu sâu về các vấn đề thông qua phương pháp tiếp cận có hệ thống và logic. Bạn muốn chúng ta cùng phân tích vấn đề gì?";
      }
      
      if (lowerCaseMessage.includes('deepseek') || lowerCaseMessage.includes('ai')) {
        return "Deepseek Reasoner được phát triển với khả năng phân tích và lập luận mạnh mẽ. Tôi tiếp cận mọi vấn đề một cách có hệ thống, phân tích từng khía cạnh và đưa ra các lập luận dựa trên logic và dữ liệu. Hãy thử đặt một câu hỏi phức tạp, và tôi sẽ giúp bạn phân tích nó một cách chi tiết.";
      }
      
      if (lowerCaseMessage.includes('thuật toán') || lowerCaseMessage.includes('algorithm')) {
        return `Hãy phân tích vấn đề này một cách có hệ thống. Khi nói về thuật toán, chúng ta cần xem xét các khía cạnh sau:

1. Độ phức tạp thời gian
2. Độ phức tạp không gian
3. Tính tối ưu
4. Các trường hợp đặc biệt

Ví dụ về phân tích thuật toán tìm kiếm nhị phân:

\`\`\`javascript
function binarySearch(arr, target) {
    let left = 0;
    let right = arr.length - 1;
    
    while (left <= right) {
        let mid = Math.floor((left + right) / 2);
        
        if (arr[mid] === target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    
    return -1;
}
\`\`\`

Phân tích:
1. Độ phức tạp thời gian: O(log n) - thuật toán chia đôi mảng trong mỗi bước
2. Độ phức tạp không gian: O(1) - chỉ sử dụng biến tạm
3. Điều kiện: Mảng phải được sắp xếp trước

Đây là một ví dụ về cách chúng ta phân tích thuật toán một cách có hệ thống.`;
      }

      if (lowerCaseMessage.includes('design pattern') || lowerCaseMessage.includes('mẫu thiết kế')) {
        return "Để phân tích design patterns, chúng ta cần xem xét từng khía cạnh:\n\n1. **Mục đích sử dụng**:\n   - Giải quyết vấn đề gì?\n   - Trong tình huống nào nên áp dụng?\n\n2. **Cấu trúc**:\n   - Các thành phần chính\n   - Mối quan hệ giữa các thành phần\n\n3. **Ưu điểm**:\n   - Tính linh hoạt\n   - Khả năng mở rộng\n   - Dễ bảo trì\n\n4. **Nhược điểm**:\n   - Độ phức tạp\n   - Chi phí hiệu năng\n   - Học phí để thành thạo\n\nHãy cho tôi biết bạn muốn phân tích chi tiết về mẫu thiết kế cụ thể nào?";
      }

      // Phản hồi chung với phong cách Deepseek Reasoner
      const genericResponses = [
        "Để phân tích vấn đề này một cách có hệ thống, chúng ta hãy chia nhỏ nó thành các khía cạnh chính và xem xét từng phần.",
        "Xét về mặt logic, chúng ta cần đánh giá vấn đề này dựa trên các tiêu chí cụ thể và dữ liệu có sẵn.",
        "Hãy tiếp cận vấn đề này theo phương pháp phân tích từ trên xuống, bắt đầu với bức tranh tổng thể rồi đi sâu vào chi tiết.",
        "Đây là một chủ đề thú vị để phân tích. Hãy xem xét nó từ các góc độ khác nhau và đánh giá mối quan hệ giữa các yếu tố.",
        "Để có cái nhìn toàn diện, chúng ta cần phân tích cả ưu điểm và nhược điểm, đồng thời xem xét các trường hợp đặc biệt."
      ];
      
      return genericResponses[Math.floor(Math.random() * genericResponses.length)];
    }

    // Hàm thêm phong cách Deepseek Reasoner
    function addDeepseekFlavor(response) {
      const reasonerPhrases = [
        "Hãy phân tích sâu hơn về vấn đề này.",
        "Xét về mặt logic và cấu trúc, ta có thể thấy rằng...",
        "Điều này dẫn đến một kết luận quan trọng:",
        "Để hiểu rõ hơn, hãy xem xét một ví dụ cụ thể.",
        "Từ góc độ phân tích hệ thống, ta cần xem xét các yếu tố sau:",
        "Dựa trên các nguyên tắc cơ bản, ta có thể lập luận rằng...",
        "Hãy chia nhỏ vấn đề này để phân tích chi tiết hơn."
      ];
      
      if (Math.random() < 0.3) {
        return response + " " + reasonerPhrases[Math.floor(Math.random() * reasonerPhrases.length)];
      }
      return response;
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
        handleError(error, 'save-conversation');
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
        "Oops, dường như có một bug nhỏ trong hệ thống. Đừng lo, tôi đang debug nhanh nhất có thể!",
        "Có vẻ như cache của tôi cần được làm mới. Xin đợi một chút nhé!",
        "Tôi vừa gặp một exception chưa được handle. Để tôi xử lý nó ngay!",
        "404 - Không tìm thấy phản hồi. Tôi đang tái cấu trúc neural network của mình...",
        "Có một lỗi nhỏ trong thuật toán. Tôi đang tối ưu lại code để hoạt động tốt hơn!"
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
        showNotification('Copied to clipboard!', 'success');
      }).catch(err => {
        handleError(err, 'clipboard-copy');
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Copied to clipboard!', 'success');
      });
    }
  
    // Hiển thị thông báo tạm thời
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');
        
        const icon = document.createElement('i');
        switch (type) {
            case 'error':
                icon.className = 'fas fa-exclamation-circle';
                break;
            case 'success':
                icon.className = 'fas fa-check-circle';
                break;
            case 'warning':
                icon.className = 'fas fa-exclamation-triangle';
                break;
            default:
                icon.className = 'fas fa-info-circle';
        }
        
        notification.appendChild(icon);
        const textSpan = document.createElement('span');
        textSpan.textContent = ' ' + message;
        notification.appendChild(textSpan);
        
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
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
        handleError(error, 'start-new-conversation');
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
        handleError(error, 'clear-current-chat');
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
        handleError(error, 'export-conversations');
        showNotification('Error exporting conversations', 'error');
      }
    };

    // Import conversations từ file JSON
    window.importConversations = function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = function(event) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedConversations = JSON.parse(e.target.result);
                    conversations = importedConversations;
                    localStorage.setItem('deepseek_conversations', JSON.stringify(conversations));
                    showNotification('Conversations imported successfully!', 'success');
                    window.location.reload();
                } catch (error) {
                    handleError(error, 'import-conversations');
                    showNotification('Error importing conversations', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
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
        .hover-hint {
          position: absolute;
          background-color: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
        }
        .hover-hint.visible {
          opacity: 1;
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

    // Voice input functionality
    let isRecording = false;
    let mediaRecorder = null;
    let audioChunks = [];

    function initializeVoiceInput() {
        const voiceButton = document.createElement('button');
        voiceButton.className = 'voice-input-button';
        voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
        voiceButton.title = 'Nhấn và giữ để ghi âm';
        voiceButton.setAttribute('aria-label', 'Nhấn và giữ để ghi âm');
        voiceButton.setAttribute('role', 'button');
        
        const inputWrapper = document.querySelector('.input-wrapper');
        inputWrapper.insertBefore(voiceButton, document.getElementById('send-button'));

        let recognition = null;
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'vi-VN';

            recognition.onresult = function(event) {
                const transcript = Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join('');
                
                userInput.value = transcript;
                userInput.style.height = 'auto';
                userInput.style.height = `${userInput.scrollHeight}px`;
                sendButton.disabled = !transcript.trim();
                voiceButton.setAttribute('aria-label', 'Đã nhận dạng: ' + transcript);
            };

            recognition.onerror = function(event) {
                handleError(event.error, 'voice-recognition');
            };

            recognition.onend = function() {
                if (isRecording) {
                    try {
                        recognition.start();
                    } catch (error) {
                        handleError(error, 'voice-recognition-restart');
                        stopRecording();
                    }
                }
            };
        } else {
            voiceButton.disabled = true;
            voiceButton.title = 'Trình duyệt không hỗ trợ nhận dạng giọng nói';
            voiceButton.setAttribute('aria-label', 'Trình duyệt không hỗ trợ nhận dạng giọng nói');
            showNotification('Trình duyệt của bạn không hỗ trợ nhận dạng giọng nói', 'error');
        }

        let recordingTimeout;
        
        voiceButton.addEventListener('mousedown', startRecording);
        voiceButton.addEventListener('touchstart', startRecording);
        voiceButton.addEventListener('mouseup', stopRecording);
        voiceButton.addEventListener('touchend', stopRecording);
        voiceButton.addEventListener('mouseleave', stopRecording);

        function startRecording(e) {
            e.preventDefault();
            if (isRecording) return;
            
            isRecording = true;
            voiceButton.classList.add('recording');
            showNotification('Recording...', 'info');
            
            if (recognition) {
                recognition.start();
            }
            
            recordingTimeout = setTimeout(() => {
                stopRecording();
            }, 10000); // Max 10 seconds recording
        }

        function stopRecording() {
            if (!isRecording) return;
            
            isRecording = false;
            voiceButton.classList.remove('recording');
            clearTimeout(recordingTimeout);
            
            if (recognition) {
                recognition.stop();
            }
        }
    }

    initializeVoiceInput();

    // Enhance error handling with custom error messages
    function handleError(error, context) {
        console.error(`Error in ${context}:`, error);
        let errorMessage = 'Có lỗi xảy ra. ';
        
        if (error.name === 'NotAllowedError' && context === 'voice-recognition') {
            errorMessage += 'Vui lòng cho phép quyền truy cập microphone.';
        } else if (error.name === 'QuotaExceededError') {
            errorMessage += 'Không thể lưu dữ liệu do đã hết dung lượng. Hãy xóa bớt lịch sử chat.';
        } else if (error.name === 'NetworkError') {
            errorMessage += 'Kiểm tra kết nối mạng của bạn và thử lại.';
        } else {
            errorMessage += 'Vui lòng thử lại sau.';
        }
        
        showNotification(errorMessage, 'error');
    }

    // Add hover hints to buttons
    function addHoverHints() {
        const buttons = document.querySelectorAll('button[title]');
        buttons.forEach(button => {
            const hint = document.createElement('div');
            hint.className = 'hover-hint';
            hint.textContent = button.getAttribute('title');
            button.appendChild(hint);
            
            button.addEventListener('mouseenter', () => {
                const rect = button.getBoundingClientRect();
                hint.style.top = `${rect.bottom + 5}px`;
                hint.style.left = `${rect.left + (rect.width / 2)}px`;
                hint.classList.add('visible');
            });
            
            button.addEventListener('mouseleave', () => {
                hint.classList.remove('visible');
            });
        });
    }

    // Initialize hover hints after DOM load
    addHoverHints();

    // Handle storage errors
    window.addEventListener('storage', function(e) {
        if (e.storageArea === localStorage) {
            try {
                const data = localStorage.getItem('deepseek_conversations');
                if (data) {
                    conversations = JSON.parse(data);
                }
            } catch (error) {
                handleError(error, 'storage');
            }
        }
    });
});
