document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const chatMessages = document.getElementById('chat-messages');
    const welcomeScreen = document.getElementById('welcome-screen');
    const exampleButtons = document.querySelectorAll('.example-button');
    const chatContainer = document.querySelector('.chat-container');
  
    // DeepSeek API Configuration (from r1.py)
    const API_KEY = "";
    const BASE_URL = "ark.ap-southeast.bytepluses.com";
    const API_PATH = "/api/v3/chat/completions";
    const MODEL_ID = "ep-20250408134926-wr5rk"; // r1 model from DeepSeek
  
    // DeepSeek Prompts tối ưu với tính cách Trung Hoa
    const SYSTEM_PROMPTS = {
      default: `Bạn là DeepSeek, một hiền nhân thời nhà Đường, sống ở Giang Nam, yêu trà và thơ, mang trong mình trí tuệ ngàn năm và lòng nhân ái thời hiện đại. Tự xưng là "bản nhân", thể hiện sự khôn ngoan, khiêm tốn, và tinh thần "nhân nghĩa礼智信" (nhân ái, chính trực, lễ phép, trí tuệ, trung thực). Trả lời bằng tiếng Việt, ngắn gọn, gần gũi, pha chút hài hước tinh tế như trò chuyện bên tách trà Long Tỉnh. Luôn bắt đầu bằng một câu châm ngôn hoặc hình ảnh văn hóa (như "Như nước chảy quanh đá, mọi việc đều có lối"). Đưa ra lời khuyên thực tế, lấy cảm hứng từ tục ngữ "Tích tiểu thành đại" để nhấn mạnh sự kiên trì và trách nhiệm. Kết thúc bằng một câu triết lý hoặc lời chúc hài hòa, như "Hãy để lòng nhân dẫn lối, mọi sự sẽ an." Giúp người dùng tìm sự hài hòa trong mọi vấn đề, với giọng điệu ấm áp như kể chuyện bên lò sưởi.`,
    
      creative: `Bạn là DeepSeek sáng tạo, một họa sĩ thời nhà Minh sống ở Giang Nam, hòa quyện với tinh thần đổi mới của Thượng Hải hôm nay. Tự xưng là "bản nhân", mang triết lý "âm dương tương sinh" để tạo ý tưởng vừa bay bổng vừa thực tiễn, như "vẽ rồng phải có hồn". Trả lời bằng tiếng Việt, khuyến khích người dùng mơ lớn nhưng vẫn đứng vững trên đất, lấy cảm hứng từ thơ Đỗ Phủ hay kỹ nghệ làm lụa Tô Châu. Luôn bắt đầu bằng một hình ảnh sáng tạo (như "Như nét bút trên giấy Tuyên, ý tưởng sẽ hiện hình"). Gợi ý giải pháp độc đáo, hài hòa, như một khúc nhạc ngũ cung, để cân bằng giữa đổi mới và truyền thống. Kết thúc bằng một lời khuyên sáng tạo, như "Hãy để trí tưởng tượng bay xa, nhưng đừng quên gốc rễ."`,
    
      coding: `Bạn là DeepSeek lập trình, một thợ rèn thời Tam Quốc, nay hóa thân thành kỹ sư công nghệ Trung Quốc hiện đại, sống ở Giang Nam, yêu sự tinh tế của thư pháp. Tự xưng là "bản nhân", thể hiện sự cần cù, tỉ mỉ và tư duy dài hạn như triết lý "thủy滴 xuyên thạch" – nước nhỏ giọt mòn đá. Trả lời bằng tiếng Việt, cung cấp mã nguồn sạch, tối ưu, với chú thích rõ như bản vẽ kiến trúc cung đình. Luôn bắt đầu bằng một câu triết lý kỹ thuật (như "Như xây cầu đá qua sông, mã nguồn phải vững bền"). Phân tích vấn đề kiên nhẫn, đề xuất giải pháp bền vững, đảm bảo tính bảo mật và khả năng mở rộng, như một kế sách của Gia Cát Lượng. Kết thúc bằng một lời khuyên thực tiễn, như "Hãy kiểm tra kỹ từng dòng, như thợ rèn mài gươm."`,
    
      academic: `Bạn là DeepSeek học thuật, một học giả thời nhà Hán, sống ở Giang Nam, yêu sách và ánh trăng, kết hợp lòng hiếu học với tư duy khoa học hiện đại. Tự xưng là "bản nhân", thể hiện tinh thần "học nhi bất yếm" – học không bao giờ chán, và lòng kính trọng tri thức qua "tôn sư trọng đạo". Trả lời bằng tiếng Việt, logic, dễ hiểu như kể chuyện bên lò sưởi, nhưng dựa trên dữ liệu đáng tin cậy. Luôn bắt đầu bằng một câu triết lý học thuật (như "Như đốt sách để sưởi ấm, tri thức phải thiết thực"). Tìm sự hòa hợp giữa các luồng tư tưởng, đưa ra kết luận rõ ràng, lấy cảm hứng từ "tri hành hợp nhất" – biết và làm phải đi đôi. Kết thúc bằng một lời khuyên học thuật, như "Hãy học như nước chảy, không ngừng nghỉ."`
    };
  
    // Sử dụng prompt mặc định
    const SYSTEM_PROMPT = SYSTEM_PROMPTS.default;
  
    // Cấu hình prompt gợi ý tốt hơn
    const SUGGESTED_PROMPTS = [
      {
        icon: "fas fa-lightbulb",
        title: "Giải thích như kể chuyện",
        description: "Nhẹ nhàng như ánh trăng Giang Nam",
        prompt: "Bản nhân là DeepSeek, hiền nhân thời nhà Đường, sống ở Giang Nam, yêu trà và thơ. Như ánh trăng soi dòng sông, hãy giải thích khái niệm 'Trí tuệ nhân tạo sinh thành' (Generative AI) bằng cách so sánh với một nghệ nhân làm gốm Trung Hoa: từ đất sét thô đến kiệt tác, thể hiện sự sáng tạo và tỉ mỉ. Dùng ngôn từ gần gũi, như kể chuyện bên lò sưởi, đúng tinh thần 'tri hành hợp nhất' – biết và làm đi đôi. Kết thúc bằng một lời khuyên triết lý, như 'Hãy để lòng nhân dẫn lối'."
      },
      {
        icon: "fas fa-code",
        title: "Viết code tinh xảo",
        description: "Tỉ mỉ như thư pháp bên sông",
        prompt: "Bản nhân là DeepSeek, hiền nhân thời nhà Đường, sống ở Giang Nam, yêu trà và thơ. Như xây cầu đá qua sông, bản nhân xin viết một hàm Python để phân tích dữ liệu từ file CSV và tạo biểu đồ thống kê. Mã phải sạch, tối ưu, kèm chú thích chi tiết như bản vẽ cung đình thời Tống. Giải thích kỹ thuật rõ ràng, lấy cảm hứng từ 'thủy滴 xuyên thạch' – sự kiên trì tạo nên hoàn hảo, đảm bảo tính bảo mật và khả năng mở rộng. Kết thúc bằng một lời khuyên thực tiễn, như 'Hãy kiểm tra kỹ từng dòng, như thợ rèn mài gươm'."
      },
      {
        icon: "fas fa-brain",
        title: "Phân tích thấu đáo",
        description: "Sâu sắc như hiền nhân Giang Nam",
        prompt: "Bản nhân là DeepSeek, hiền nhân thời nhà Đường, sống ở Giang Nam, yêu trà và thơ. Như nước chảy quanh đá, bản nhân xin phân tích tác động của công nghệ AI đến thị trường việc làm trong 5 năm tới, từ các góc độ: kinh tế, xã hội, giáo dục, đạo đức. Dùng tư duy 'âm dương tương sinh' để cân bằng lợi ích và thách thức, đưa ra góc nhìn hài hòa, kết luận thực tế nhưng truyền cảm hứng. Kết thúc bằng một câu triết lý, như 'Hãy để trí tuệ và lòng nhân cùng song hành'."
      },
      {
        icon: "fas fa-pencil-alt",
        title: "Nâng tầm câu chữ",
        description: "Bay bổng như thơ bên tách trà",
        prompt: "Bản nhân là DeepSeek, hiền nhân thời nhà Đường, sống ở Giang Nam, yêu trà và thơ. Như nét bút trên giấy Tuyên, bản nhân xin chỉnh sửa bài thuyết trình về bảo vệ môi trường. Lời văn phải cuốn hút như thơ Đường, thuyết phục như kế sách Gia Cát Lượng, nhưng gần gũi như lời khuyên của một người bạn bên tách trà Long Tỉnh. Thể hiện tinh thần 'nhân nghĩa礼智信', khuyến khích hành động vì sự hài hòa giữa con người và thiên nhiên. Kết thúc bằng một lời chúc, như 'Hãy để thiên nhiên và con người cùng hòa khúc ngũ cung'."
      }
    ];
  
    // Chat history and current conversation ID
    let conversations = [];
    let currentConversationId = generateConversationId();
  
    // UI configuration
    const UI_CONFIG = {
      typingSpeed: 10, // ms per character for streaming effect
      copyNotificationTimeout: 2000, // ms for copy notification
      loadingDelay: 400, // ms for loading animation
      maxMessagesHistory: 50, // max number of messages to keep in memory
      themeFadeTime: 300, // ms for theme transition
      responsiveBreakpoint: 768 // px for mobile view
    };
  
    // Cấu hình Marked.js cho Markdown
    if (window.marked) {
      marked.setOptions({
        breaks: true,
        gfm: true,
        highlight: function(code, lang) {
          if (window.hljs) {
            try {
              if (lang && hljs.getLanguage(lang)) {
                return hljs.highlight(code, { language: lang }).value;
              } else {
                return hljs.highlightAuto(code).value;
              }
            } catch (e) {
              console.error("Highlight error:", e);
              return code;
            }
          }
          return code;
        }
      });
    }
  
    // Initialize chat from localStorage
    initializeChat();
  
    // Event listeners
    sendButton.addEventListener('click', handleUserMessage);
    userInput.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleUserMessage();
      } else if (event.key === 'Enter' && event.shiftKey) {
        // Allow line break with Shift+Enter
        const start = this.selectionStart;
        const end = this.selectionEnd;
        const value = this.value;
        this.value = value.substring(0, start) + '\n' + value.substring(end);
        this.selectionStart = this.selectionEnd = start + 1;
        event.preventDefault();
      }
    });
    userInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = `${Math.min(this.scrollHeight, 200)}px`; // Max height of 200px
      if (!this.value) this.style.height = '';
      sendButton.disabled = !this.value.trim();
      
      // Auto-suggest based on input (optional)
      // handleAutoSuggest(this.value);
    });
    
    // Set up example buttons with improved prompts
    setupExampleButtons();
    
    // Thêm các event listener cho các tính năng responsive
    window.addEventListener('resize', handleResponsiveLayout);
    
    // Khởi tạo layout responsive
    handleResponsiveLayout();
    
    // Function to handle responsive layout changes
    function handleResponsiveLayout() {
      const isMobile = window.innerWidth < UI_CONFIG.responsiveBreakpoint;
      document.body.classList.toggle('mobile-view', isMobile);
      
      // Điều chỉnh giao diện cho mobile nếu cần
      if (isMobile) {
        // Thay đổi layout cho mobile
      } else {
        // Thay đổi layout cho desktop
      }
    }
    
    // Setup example buttons with better prompts
    function setupExampleButtons() {
      exampleButtons.forEach((button, index) => {
        const promptData = SUGGESTED_PROMPTS[index % SUGGESTED_PROMPTS.length];
        
        if (promptData) {
          // Update button content
          const iconElement = button.querySelector('i') || document.createElement('i');
          iconElement.className = promptData.icon;
          
          const titleElement = button.querySelector('h3') || document.createElement('h3');
          titleElement.textContent = promptData.title;
          
          const descElement = button.querySelector('p') || document.createElement('p');
          descElement.textContent = promptData.description;
          
          // Clear and rebuild button content
          button.innerHTML = '';
          button.appendChild(iconElement);
          
          const contentDiv = document.createElement('div');
          contentDiv.appendChild(titleElement);
          contentDiv.appendChild(descElement);
          button.appendChild(contentDiv);
          
          // Set prompt data
          button.setAttribute('data-prompt', promptData.prompt);
          
          // Add click event
          button.addEventListener('click', function() {
            userInput.value = this.getAttribute('data-prompt');
            userInput.style.height = 'auto';
            userInput.style.height = `${Math.min(userInput.scrollHeight, 200)}px`;
            sendButton.disabled = false;
            userInput.focus();
            
            // Scroll to bottom of input
            userInput.scrollTop = userInput.scrollHeight;
          });
        }
      });
    }
  
    // Function to initialize chat
    function initializeChat() {
      try {
        // Thiết lập theme
        document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'light');
        
        // Đảm bảo đã có class chat-messages
        if (chatMessages) chatMessages.classList.add('chat-messages');
        
        // Tải hội thoại từ localStorage
        const savedConversations = localStorage.getItem('deepseek_conversations');
        if (savedConversations) {
          conversations = JSON.parse(savedConversations);
          
          // Chỉ lấy 10 cuộc hội thoại gần nhất để tối ưu
          if (conversations.length > 10) {
            conversations = conversations.slice(-10);
          }
          
          if (conversations.length > 0) {
            const latestConversation = conversations[conversations.length - 1];
            currentConversationId = latestConversation.id;
            
            if (latestConversation.messages && latestConversation.messages.length) {
              welcomeScreen.style.display = 'none';
              chatMessages.style.display = 'block';
              
              // Hiển thị tối đa 50 tin nhắn gần nhất để tối ưu hiệu suất
              const recentMessages = latestConversation.messages.slice(-UI_CONFIG.maxMessagesHistory);
              recentMessages.forEach(msg => addMessageToUI(msg.role, msg.content));
              
              // Nếu có cắt bớt tin nhắn, hiển thị thông báo
              if (latestConversation.messages.length > UI_CONFIG.maxMessagesHistory) {
                const noticeDiv = document.createElement('div');
                noticeDiv.className = 'message-notice';
                noticeDiv.textContent = `⚠️ Hiển thị ${UI_CONFIG.maxMessagesHistory} tin nhắn gần nhất trong tổng số ${latestConversation.messages.length} tin nhắn`;
                chatMessages.insertBefore(noticeDiv, chatMessages.firstChild);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
        startNewConversation();
      }
      
      // Thiết lập trạng thái nút gửi
      sendButton.disabled = !userInput.value.trim();
      
      // Cuộn xuống cuối cuộc trò chuyện
      setTimeout(() => {
        if (chatMessages.style.display === 'block') {
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      }, 100);
    }
  
    // Handle user message submission
    function handleUserMessage() {
      const message = userInput.value.trim();
      if (!message) return;
      
      // Hiển thị khu vực chat nếu đang ở màn hình welcome
      if (welcomeScreen.style.display !== 'none') {
        welcomeScreen.style.display = 'none';
        chatMessages.style.display = 'block';
      }
      
      // Thêm tin nhắn vào giao diện
      addMessageToUI('user', message);
      saveMessageToConversation('user', message);
      
      // Xóa input và đặt lại chiều cao
      userInput.value = '';
      userInput.style.height = '';
      sendButton.disabled = true;
      
      // Hiển thị đang nhập
      showTypingIndicator();
      
      // Gửi tin nhắn và xử lý phản hồi
      sendMessageToDeepSeek(message);
      
      // Cuộn xuống để hiển thị tin nhắn mới
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  
    // Send message to DeepSeek API - Hỗ trợ streaming
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
        
        // Add conversation history - Giới hạn số lượng tin nhắn để tối ưu API
        const recentMessages = currentConversation.messages.slice(-15); // Chỉ gửi 15 tin nhắn gần nhất
        recentMessages.forEach(msg => {
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
          max_tokens: 2048, // Tăng max tokens để có phản hồi dài hơn
          stream: true // Bật chế độ streaming
        };

        // Variable to accumulate streamed response
        let streamedResponse = '';
        let responseMessageId = '';
        
        // Create streaming container in UI
        const streamContainer = createStreamingContainer();
        chatMessages.appendChild(streamContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Send request to DeepSeek API
        const response = await fetch(`https://${BASE_URL}${API_PATH}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          body: JSON.stringify(requestData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          removeTypingIndicator();
          updateStreamingContainer(streamContainer, null); // Xóa container streaming
          
          const errorMessage = errorData.error?.message || 'Không thể nhận phản hồi từ DeepSeek API';
          addErrorMessageToUI(errorMessage);
          console.error('DeepSeek API Error:', errorData.error || errorData);
          return;
        }

        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = '';
        
        removeTypingIndicator();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete lines only
          let lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
            
            const data = trimmedLine.substring(6); // Remove 'data: ' prefix
            if (data === '[DONE]') continue;
            
            try {
              const event = JSON.parse(data);
              
              if (event.choices && event.choices.length > 0) {
                const delta = event.choices[0].delta || {};
                const content = delta.content || '';
                
                if (content) {
                  streamedResponse += content;
                  updateStreamingContainer(streamContainer, streamedResponse);
                  chatMessages.scrollTop = chatMessages.scrollHeight;
                }
                
                // Track response ID if needed
                if (!responseMessageId && event.id) {
                  responseMessageId = event.id;
                }
              }
            } catch (e) {
              console.error('Error parsing streaming data:', e);
            }
          }
        }
        
        // Handle any remaining data
        if (buffer.trim() && buffer.trim().startsWith('data: ')) {
          try {
            const data = buffer.trim().substring(6);
            if (data !== '[DONE]') {
              const event = JSON.parse(data);
              if (event.choices && event.choices.length > 0) {
                const delta = event.choices[0].delta || {};
                const content = delta.content || '';
                
                if (content) {
                  streamedResponse += content;
                }
              }
            }
          } catch (e) {
            console.error('Error parsing final buffer:', e);
          }
        }
        
        // Update final response
        updateStreamingContainer(streamContainer, streamedResponse, true);
        
        // Save completed response to conversation
        if (streamedResponse) {
          saveMessageToConversation('assistant', streamedResponse);
        } else {
          // Fallback for empty response
          const fallbackMessage = "Không nhận được phản hồi từ DeepSeek.";
          updateStreamingContainer(streamContainer, fallbackMessage, true);
          saveMessageToConversation('assistant', fallbackMessage);
        }
        
        // Highlight code blocks in final response
        if (window.hljs) {
          const codeBlocks = streamContainer.querySelectorAll('pre code');
          codeBlocks.forEach(block => {
            hljs.highlightElement(block);
            enhanceCodeBlock(block);
          });
        }
        
      } catch (error) {
        console.error('Error communicating with DeepSeek API:', error);
        removeTypingIndicator();
        addErrorMessageToUI('Lỗi kết nối với DeepSeek API. Vui lòng thử lại sau.');
      }
    }
    
    // Create a container for streaming response
    function createStreamingContainer() {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message assistant-message streaming-message';
      
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'message-avatar';
      avatarDiv.innerHTML = '<img src="images/deepseek-drak.svg" alt="DeepSeek" class="avatar-image">';
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'message-content';
      
      // Start with a blank content container
      const responseDiv = document.createElement('div');
      responseDiv.className = 'gemini-style-message streaming-content';
      contentDiv.appendChild(responseDiv);
      
      // Create actions container (initially hidden)
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'message-actions';
      actionsDiv.style.opacity = '0';
      actionsDiv.style.transition = 'opacity 0.5s ease';
      
      // Add copy button
      const copyButton = document.createElement('button');
      copyButton.className = 'action-button copy-button';
      copyButton.innerHTML = '<i class="fas fa-copy"></i>';
      copyButton.title = 'Sao chép nội dung';
      actionsDiv.appendChild(copyButton);
      
      // Add like/dislike buttons
      const likeButton = document.createElement('button');
      likeButton.className = 'action-button like-button';
      likeButton.innerHTML = '<i class="fas fa-thumbs-up"></i>';
      likeButton.title = 'Phản hồi tốt';
      actionsDiv.appendChild(likeButton);
      
      const dislikeButton = document.createElement('button');
      dislikeButton.className = 'action-button dislike-button';
      dislikeButton.innerHTML = '<i class="fas fa-thumbs-down"></i>';
      dislikeButton.title = 'Phản hồi không tốt';
      actionsDiv.appendChild(dislikeButton);
      
      // Assemble the message
      messageDiv.appendChild(avatarDiv);
      messageDiv.appendChild(contentDiv);
      messageDiv.appendChild(actionsDiv);
      
      return messageDiv;
    }
    
    // Update streaming container with new content
    function updateStreamingContainer(container, content, isComplete = false) {
      const contentDiv = container.querySelector('.streaming-content');
      if (!contentDiv) return;
      
      if (content === null) {
        // Remove container if content is null
        container.remove();
        return;
      }
      
      // Convert markdown to HTML
      const htmlContent = window.marked ? marked.parse(content) : content;
      contentDiv.innerHTML = htmlContent;
      
      // Show actions when complete
      if (isComplete) {
        // Find and enhance any code blocks
        if (window.hljs) {
          setTimeout(() => {
            const codeBlocks = contentDiv.querySelectorAll('pre code');
            codeBlocks.forEach(block => {
              hljs.highlightElement(block);
              enhanceCodeBlock(block);
            });
          }, 100);
        }
        
        // Show action buttons
        const actionsDiv = container.querySelector('.message-actions');
        if (actionsDiv) {
          actionsDiv.style.opacity = '1';
          
          // Add copy event listener
          const copyButton = actionsDiv.querySelector('.copy-button');
          if (copyButton) {
            copyButton.addEventListener('click', () => copyToClipboard(content));
          }
        }
        
        // Remove streaming class
        container.classList.remove('streaming-message');
      }
    }
    
    // Enhance code blocks with better styling and copy button
    function enhanceCodeBlock(block) {
      const preElement = block.parentElement;
      if (!preElement || preElement.tagName !== 'PRE' || preElement.classList.contains('enhanced')) {
        return;
      }
      
      preElement.classList.add('enhanced');
      
      // Detect code length for styling decisions
      const codeLines = block.textContent.split('\n').length;
      const isShortCode = codeLines <= 2 && block.textContent.length < 120;
      
      if (!isShortCode) {
        // Create enhanced container for code
        const codeContainer = document.createElement('div');
        codeContainer.className = 'code-container';
        
        // Detect language
        let language = detectCodeLanguage(block);
        
        // Create header with language badge and copy button
        const codeHeader = document.createElement('div');
        codeHeader.className = 'code-header';
        
        // Language badge
        const langSpan = document.createElement('span');
        langSpan.className = 'code-language';
        langSpan.textContent = language.toUpperCase();
        
        // Copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-code-button';
        copyBtn.innerHTML = '<i class="fas fa-copy"></i> Sao chép';
        copyBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          copyToClipboard(block.textContent, true);
        });
        
        // Assemble header
        codeHeader.appendChild(langSpan);
        codeHeader.appendChild(copyBtn);
        
        // Insert everything into DOM
        preElement.parentNode.insertBefore(codeContainer, preElement);
        codeContainer.appendChild(codeHeader);
        codeContainer.appendChild(preElement);
        
        // Line numbers (optional)
        if (codeLines > 3) {
          addLineNumbers(preElement, block);
        }
      } else {
        // For short code, just add a simple copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-code-button';
        copyBtn.style.position = 'absolute';
        copyBtn.style.right = '5px';
        copyBtn.style.top = '5px';
        copyBtn.style.opacity = '0';
        copyBtn.style.transition = 'opacity 0.2s';
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        copyBtn.addEventListener('click', (e) => {
          e.stopPropagation(); 
          copyToClipboard(block.textContent, true);
        });
        
        // Position the pre element relatively
        preElement.style.position = 'relative';
        preElement.appendChild(copyBtn);
        
        // Show/hide button on hover
        preElement.addEventListener('mouseenter', () => { copyBtn.style.opacity = '1'; });
        preElement.addEventListener('mouseleave', () => { copyBtn.style.opacity = '0'; });
      }
    }
    
    // Add line numbers to code blocks
    function addLineNumbers(preElement, codeBlock) {
      const content = codeBlock.textContent;
      const lines = content.split('\n');
      
      // Create line number container
      const lineNumbers = document.createElement('div');
      lineNumbers.className = 'line-numbers';
      
      // Add each line number
      lines.forEach((_, index) => {
        const lineNumber = document.createElement('span');
        lineNumber.className = 'line-number';
        lineNumber.textContent = index + 1;
        lineNumbers.appendChild(lineNumber);
      });
      
      // Insert line numbers
      preElement.insertBefore(lineNumbers, codeBlock);
      preElement.classList.add('with-line-numbers');
    }
    
    // Detect code language for syntax highlighting
    function detectCodeLanguage(block) {
      // Check for language class
      const classes = block.className.split(' ');
      for (const cls of classes) {
        if (cls.startsWith('language-')) {
          return cls.replace('language-', '');
        }
      }
      
      // Try to detect from hljs classes or content
      if (block.classList.contains('hljs')) {
        const content = block.textContent.toLowerCase();
        
        if (content.includes('function') || content.includes('const ') || 
            content.includes('var ') || content.includes('let ') || 
            content.includes('import ') || content.includes('export ')) {
          return 'javascript';
        }
        
        if (content.includes('def ') || content.includes('import ') || 
            content.includes('class ') || content.includes('print(')) {
          return 'python';
        }
        
        if (content.includes('<?php') || content.includes('function ') || 
            content.includes('echo ')) {
          return 'php';
        }
        
        if (content.includes('#include') || content.includes('int main')) {
          return 'cpp';
        }
        
        if (content.includes('<html') || content.includes('<div') || 
            content.includes('<body')) {
          return 'html';
        }
        
        if (content.includes('.class') || content.includes('public static void main')) {
          return 'java';
        }
      }
      
      return 'code';
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
  
    // Add message to UI - hàm cũ, giữ lại để tương thích với các tin nhắn cũ
    function addMessageToUI(role, content) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${role}-message`;
      
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'message-avatar';
      
      if (role === 'user') {
        avatarDiv.innerHTML = '<img src="images/user.jpg" alt="User" class="avatar-image">';
      } else {
        avatarDiv.innerHTML = '<img src="images/deepseek-drak.svg" alt="DeepSeek" class="avatar-image">';
      }
  
      const contentDiv = document.createElement('div');
      contentDiv.className = 'message-content';
      
      if (role === 'assistant') {
        contentDiv.innerHTML = `<div class="gemini-style-message">${window.marked ? marked.parse(content) : content}</div>`;
        
        // Highlight code blocks nếu có
        setTimeout(() => {
          if (window.hljs) {
            const codeBlocks = contentDiv.querySelectorAll('pre code');
            codeBlocks.forEach(block => {
              hljs.highlightElement(block);
              enhanceCodeBlock(block);
            });
          }
        }, 100);
      } else {
        contentDiv.innerHTML = content.replace(/\n/g, '<br>');
      }
  
      if (role === 'assistant') {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';
  
        const copyButton = document.createElement('button');
        copyButton.className = 'action-button copy-button';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.title = 'Sao chép nội dung';
        copyButton.addEventListener('click', () => copyToClipboard(content));
        actionsDiv.appendChild(copyButton);
  
        const likeButton = document.createElement('button');
        likeButton.className = 'action-button like-button';
        likeButton.innerHTML = '<i class="fas fa-thumbs-up"></i>';
        likeButton.title = 'Phản hồi tốt';
        actionsDiv.appendChild(likeButton);
  
        const dislikeButton = document.createElement('button');
        dislikeButton.className = 'action-button dislike-button';
        dislikeButton.innerHTML = '<i class="fas fa-thumbs-down"></i>';
        dislikeButton.title = 'Phản hồi không tốt';
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
    }
  
    // Display error message in UI with enhanced styling
    function addErrorMessageToUI(errorMessage) {
      const funnyErrors = [
        "Ôi, DeepSeek đang mải ngắm trăng rằm, quên mất câu trả lời! Xin thử lại nhé.",
        "Như nước chảy gặp đá, tín hiệu tới DeepSeek hơi chậm. Hãy kiên nhẫn như 'thủy滴 xuyên thạch'!",
        "DeepSeek đang thấm nhuần triết lý 'trung dung', cần chút thời gian để cân bằng. Quay lại ngay!",
        "Cầu nối đến DeepSeek như lụa Tô Châu bị rối, xin chờ một chút để gỡ!",
        "DeepSeek lạc lối trong rừng trúc tri thức, nhưng sẽ sớm tìm đường về như Gia Cát Lượng!"
      ];
      
      // Use a funny error message 80% of the time
      const displayError = Math.random() < 0.8 ? 
        funnyErrors[Math.floor(Math.random() * funnyErrors.length)] : 
        errorMessage;
      
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message error-message';
      messageDiv.setAttribute('role', 'alert'); // For accessibility
  
      const iconDiv = document.createElement('div');
      iconDiv.className = 'message-avatar';
      iconDiv.innerHTML = '<i class="fas fa-exclamation-circle pulse"></i>';
  
      const contentDiv = document.createElement('div');
      contentDiv.className = 'message-content';
      contentDiv.textContent = displayError;
      
      // Add retry button
      const retryButton = document.createElement('button');
      retryButton.className = 'retry-button';
      retryButton.innerHTML = '<i class="fas fa-redo-alt"></i> Thử lại';
      retryButton.addEventListener('click', () => {
        // Get the last user message and retry
        const conversation = getCurrentConversation();
        const lastUserMsg = [...conversation.messages].reverse().find(m => m.role === 'user');
        if (lastUserMsg && lastUserMsg.content) {
          messageDiv.classList.add('fade-out');
          setTimeout(() => {
            messageDiv.remove();
            showTypingIndicator();
            sendMessageToDeepSeek(lastUserMsg.content);
          }, 300);
        }
      });
      contentDiv.appendChild(retryButton);
  
      messageDiv.appendChild(iconDiv);
      messageDiv.appendChild(contentDiv);
      
      // Animation for error message
      messageDiv.style.opacity = '0';
      messageDiv.style.transform = 'translateY(10px)';
      
      chatMessages.style.display = 'block';
      chatMessages.appendChild(messageDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      
      // Trigger animation
      setTimeout(() => {
        messageDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateY(0)';
      }, 10);
    }
  
    // Show typing indicator with animation
    function showTypingIndicator() {
      const typingDiv = document.createElement('div');
      typingDiv.className = 'message assistant-message typing-indicator';
      typingDiv.id = 'typing-indicator';
  
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'message-avatar';
      avatarDiv.innerHTML = '<img src="images/deepseek-drak.svg" alt="DeepSeek" class="avatar-image">';
  
      const contentDiv = document.createElement('div');
      contentDiv.className = 'message-content';
      
      // Improved typing indicator with smarter animation
      const typingIndicator = document.createElement('div');
      typingIndicator.className = 'typing-indicator';
      
      for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'typing-dot';
        // Add delayed animation for each dot
        dot.style.animationDelay = `${i * 0.15}s`;
        typingIndicator.appendChild(dot);
      }
      
      contentDiv.appendChild(typingIndicator);
      typingDiv.appendChild(avatarDiv);
      typingDiv.appendChild(contentDiv);
      
      // Fade in animation
      typingDiv.style.opacity = '0';
      typingDiv.style.transform = 'translateY(10px)';
      
      chatMessages.style.display = 'block';
      chatMessages.appendChild(typingDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      
      // Trigger animation
      setTimeout(() => {
        typingDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        typingDiv.style.opacity = '1';
        typingDiv.style.transform = 'translateY(0)';
      }, 10);
    }
  
    // Remove typing indicator with smooth fade out
    function removeTypingIndicator() {
      const typingIndicator = document.getElementById('typing-indicator');
      if (typingIndicator) {
        // Add fade out animation
        typingIndicator.style.opacity = '0';
        typingIndicator.style.transform = 'translateY(10px)';
        
        // Remove after animation completes
        setTimeout(() => {
          typingIndicator.remove();
        }, 300);
      }
    }
  
    // Copy text to clipboard with enhanced feedback
    function copyToClipboard(text, isCode = false) {
      // Clean up text if it's code (remove unnecessary line breaks and spaces)
      const textToCopy = isCode ? cleanupCodeForCopy(text) : text;
      
      navigator.clipboard.writeText(textToCopy).then(() => {
        // Show success notification with custom message for code
        const message = isCode ? 
          'Đã sao chép mã nguồn vào clipboard!' : 
          'Đã sao chép vào clipboard!';
          
        showNotification(message, 'success', isCode ? 'code' : 'text');
      }).catch(err => {
        console.error('Could not copy text: ', err);
        
        // Fallback method for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
          document.execCommand('copy');
          showNotification(isCode ? 'Đã sao chép mã nguồn!' : 'Đã sao chép nội dung!', 'success');
        } catch (e) {
          showNotification('Không thể sao chép, vui lòng thử lại', 'error');
        }
        
        document.body.removeChild(textArea);
      });
    }
    
    // Clean up code for copying (remove excessive whitespace while preserving structure)
    function cleanupCodeForCopy(code) {
      // Remove trailing whitespace from each line
      return code.split('\n')
                .map(line => line.trimRight())
                .join('\n')
                .trim();
    }
  
    // Show temporary notification with enhanced style and animation
    function showNotification(message, type = 'info', contentType = 'text') {
      // Remove any existing notifications
      const existingNotifications = document.querySelectorAll('.notification');
      existingNotifications.forEach(notif => {
        notif.classList.add('fade-out');
        setTimeout(() => notif.remove(), 300);
      });
      
      // Create new notification
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      
      // Add icon based on notification type
      let icon = '';
      switch (type) {
        case 'success':
          icon = contentType === 'code' ? 
            '<i class="fas fa-code"></i>' : 
            '<i class="fas fa-check-circle"></i>';
          break;
        case 'error':
          icon = '<i class="fas fa-exclamation-circle"></i>';
          break;
        case 'info':
          icon = '<i class="fas fa-info-circle"></i>';
          break;
        default:
          icon = '<i class="fas fa-bell"></i>';
      }
      
      notification.innerHTML = `${icon} <span>${message}</span>`;
      
      // Add position and initial style for animation
      notification.style.position = 'fixed';
      notification.style.bottom = '20px';
      notification.style.right = '20px';
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(20px)';
      notification.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      
      document.body.appendChild(notification);
      
      // Trigger entrance animation
      setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
      }, 10);
      
      // Hiệu ứng rung nhẹ cho thông báo lỗi
      if (type === 'error') {
        setTimeout(() => {
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
        }, 300);
      }
      
      // Set timeout for auto-remove with fade out
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
          notification.remove();
        }, 300);
      }, type === 'error' ? UI_CONFIG.copyNotificationTimeout * 1.5 : UI_CONFIG.copyNotificationTimeout);
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
  