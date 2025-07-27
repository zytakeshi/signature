interface Env {
  OPENAI_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/generate" && request.method === "POST") {
      try {
        const body = await request.json() as { name: string; language?: string };
        const { name, language = 'en' } = body;

        if (!name || name.trim().length === 0) {
          const errorMessage = language === 'zh' ? "姓名是必需的" : "Name is required";
          return new Response(JSON.stringify({ error: errorMessage }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }

        // Enhanced prompt for DALL-E-3 to generate better signatures for both English and Chinese names
        const promptTemplate = language === 'zh' 
          ? `用黑色墨水在白纸上为"${name}"生成手写签名。`
          : `Generate a handwritten signature for the name "${name}" in black ink on a white background.`;

        const response = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: promptTemplate,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            style: "natural"
          })
        });

        if (!response.ok) {
          const error = await response.text();
          console.error('OpenAI API Error:', error);
          const errorMessage = language === 'zh' 
            ? "生成签名失败，请重试。" 
            : "Failed to generate signature. Please try again.";
          return new Response(JSON.stringify({ 
            error: errorMessage 
          }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        const data = await response.json();
        return new Response(JSON.stringify(data), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        console.error('Error:', error);
        const errorMessage = "An unexpected error occurred. Please try again.";
        return new Response(JSON.stringify({ 
          error: errorMessage 
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // Serve the enhanced HTML with Chinese language support and payment flow
    return new Response(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>AI Signature Generator</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }

            .container {
              background: rgba(255, 255, 255, 0.95);
              backdrop-filter: blur(10px);
              border-radius: 20px;
              padding: 40px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
              width: 100%;
              max-width: 500px;
              text-align: center;
              border: 1px solid rgba(255, 255, 255, 0.2);
              position: relative;
            }

            .language-switcher {
              position: absolute;
              top: 20px;
              right: 20px;
              display: flex;
              gap: 5px;
            }

            .lang-btn {
              background: transparent;
              border: 1px solid rgba(102, 126, 234, 0.3);
              color: #667eea;
              padding: 8px 12px;
              border-radius: 6px;
              cursor: pointer;
              transition: all 0.3s ease;
              font-size: 0.9rem;
              font-weight: 500;
            }

            .lang-btn.active {
              background: linear-gradient(135deg, #667eea, #764ba2);
              color: white;
              border-color: transparent;
            }

            .lang-btn:hover:not(.active) {
              background: rgba(102, 126, 234, 0.1);
            }

            h1 {
              color: #2d3748;
              font-size: 2.5rem;
              font-weight: 700;
              margin-bottom: 10px;
              background: linear-gradient(135deg, #667eea, #764ba2);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }

            .subtitle {
              color: #718096;
              font-size: 1.1rem;
              margin-bottom: 30px;
              font-weight: 400;
            }

            .form-group {
              margin-bottom: 25px;
              position: relative;
            }

            input[type="text"], input[type="password"] {
              width: 100%;
              padding: 16px 20px;
              font-size: 1.1rem;
              border: 2px solid #e2e8f0;
              border-radius: 12px;
              background: white;
              transition: all 0.3s ease;
              outline: none;
              color: #2d3748;
            }

            input[type="text"]:focus, input[type="password"]:focus {
              border-color: #667eea;
              box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
              transform: translateY(-2px);
            }

            .generate-btn, .payment-btn, .pin-btn {
              background: linear-gradient(135deg, #667eea, #764ba2);
              color: white;
              border: none;
              padding: 16px 32px;
              font-size: 1.1rem;
              font-weight: 600;
              border-radius: 12px;
              cursor: pointer;
              transition: all 0.3s ease;
              width: 100%;
              position: relative;
              overflow: hidden;
            }

            .generate-btn:hover:not(:disabled), .payment-btn:hover:not(:disabled), .pin-btn:hover:not(:disabled) {
              transform: translateY(-2px);
              box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
            }

            .generate-btn:disabled, .payment-btn:disabled, .pin-btn:disabled {
              opacity: 0.7;
              cursor: not-allowed;
              transform: none;
            }

            .loading-spinner {
              display: none;
              width: 20px;
              height: 20px;
              border: 2px solid transparent;
              border-top: 2px solid white;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin-right: 10px;
            }

            .generate-btn.loading .loading-spinner, .payment-btn.loading .loading-spinner, .pin-btn.loading .loading-spinner {
              display: inline-block;
            }

            .generate-btn.loading .btn-text, .payment-btn.loading .btn-text, .pin-btn.loading .btn-text {
              opacity: 0.8;
            }

            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }

            .signature-container {
              margin-top: 30px;
              display: none;
              animation: fadeInUp 0.6s ease;
            }

            .signature-container.show {
              display: block;
            }

            .signature-image {
              max-width: 100%;
              height: auto;
              border-radius: 12px;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
              border: 2px solid #e2e8f0;
              background: white;
              padding: 20px;
              margin-bottom: 20px;
            }

            .download-btn {
              background: #48bb78;
              color: white;
              border: none;
              padding: 12px 24px;
              font-size: 1rem;
              font-weight: 600;
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.3s ease;
              margin-right: 10px;
            }

            .download-btn:hover {
              background: #38a169;
              transform: translateY(-1px);
            }

            .regenerate-btn {
              background: transparent;
              color: #667eea;
              border: 2px solid #667eea;
              padding: 12px 24px;
              font-size: 1rem;
              font-weight: 600;
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.3s ease;
            }

            .regenerate-btn:hover {
              background: #667eea;
              color: white;
              transform: translateY(-1px);
            }

            .error-message {
              background: #fed7d7;
              color: #c53030;
              padding: 12px 16px;
              border-radius: 8px;
              margin-top: 15px;
              display: none;
              border-left: 4px solid #e53e3e;
            }

            .error-message.show {
              display: block;
              animation: shake 0.5s ease;
            }

            .success-message {
              background: #c6f6d5;
              color: #22543d;
              padding: 12px 16px;
              border-radius: 8px;
              margin-top: 15px;
              display: none;
              border-left: 4px solid #38a169;
            }

            .success-message.show {
              display: block;
              animation: fadeInUp 0.5s ease;
            }

            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              25% { transform: translateX(-5px); }
              75% { transform: translateX(5px); }
            }

            .progress-bar {
              height: 4px;
              background: #e2e8f0;
              border-radius: 2px;
              margin-top: 20px;
              overflow: hidden;
              display: none;
            }

            .progress-bar.show {
              display: block;
            }

            .progress-fill {
              height: 100%;
              background: linear-gradient(90deg, #667eea, #764ba2);
              border-radius: 2px;
              width: 0%;
              animation: progress 3s ease-in-out;
            }

            @keyframes progress {
              0% { width: 0%; }
              50% { width: 70%; }
              100% { width: 100%; }
            }

            @media (max-width: 480px) {
              .container {
                padding: 30px 20px;
                margin: 10px;
              }
              
              h1 {
                font-size: 2rem;
              }
              
              .generate-btn, .payment-btn, .pin-btn, .download-btn, .regenerate-btn {
                width: 100%;
                margin: 5px 0;
              }

              .language-switcher {
                position: static;
                justify-content: center;
                margin-bottom: 20px;
              }
            }

            .features {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 15px;
              margin: 25px 0;
              padding: 20px 0;
              border-top: 1px solid #e2e8f0;
            }

            .feature {
              text-align: center;
              padding: 15px;
              background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
              border-radius: 10px;
              border: 1px solid rgba(102, 126, 234, 0.2);
            }

            .feature-icon {
              font-size: 1.5rem;
              margin-bottom: 8px;
            }

            .feature-text {
              font-size: 0.9rem;
              color: #4a5568;
              font-weight: 500;
            }

            /* Payment specific styles */
            .payment-section {
              display: none;
              animation: fadeInUp 0.6s ease;
            }

            .payment-section.show {
              display: block;
            }

            .name-section {
              display: block;
            }

            .name-section.hide {
              display: none;
            }

            .payment-info {
              background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
              border: 1px solid rgba(102, 126, 234, 0.2);
              border-radius: 12px;
              padding: 20px;
              margin: 20px 0;
            }

            .price {
              font-size: 2rem;
              font-weight: 700;
              color: #2d3748;
              margin-bottom: 10px;
            }

            .price-desc {
              color: #718096;
              font-size: 0.9rem;
              margin-bottom: 15px;
            }

            .pin-form {
              display: none;
              animation: fadeInUp 0.6s ease;
            }

            .pin-form.show {
              display: block;
            }

            .pin-input {
              font-family: 'Courier New', monospace;
              letter-spacing: 3px;
              text-align: center;
              font-size: 1.2rem;
            }

            .security-icon {
              font-size: 3rem;
              margin-bottom: 20px;
              opacity: 0.8;
            }

            .payment-steps {
              display: flex;
              justify-content: space-between;
              margin: 30px 0;
              padding: 0 20px;
            }

            .step {
              display: flex;
              flex-direction: column;
              align-items: center;
              flex: 1;
              position: relative;
            }

            .step-number {
              width: 30px;
              height: 30px;
              border-radius: 50%;
              background: #e2e8f0;
              color: #718096;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 600;
              font-size: 0.9rem;
              margin-bottom: 10px;
            }

            .step.active .step-number {
              background: linear-gradient(135deg, #667eea, #764ba2);
              color: white;
            }

            .step.completed .step-number {
              background: #48bb78;
              color: white;
            }

            .step-text {
              font-size: 0.8rem;
              color: #718096;
              text-align: center;
            }

            .step:not(:last-child)::after {
              content: '';
              position: absolute;
              top: 15px;
              right: -50%;
              width: 100%;
              height: 2px;
              background: #e2e8f0;
              z-index: -1;
            }

            .step.completed:not(:last-child)::after {
              background: #48bb78;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="language-switcher">
              <button class="lang-btn" data-lang="en">EN</button>
              <button class="lang-btn" data-lang="zh">中文</button>
            </div>

            <h1 data-i18n="title">✨ AI Signature Generator</h1>
            <p class="subtitle" data-i18n="subtitle">Create beautiful, professional signatures powered by DALL-E 3</p>
            
            <div class="features">
              <div class="feature">
                <div class="feature-icon">🎨</div>
                <div class="feature-text" data-i18n="feature.ai">AI-Powered</div>
              </div>
              <div class="feature">
                <div class="feature-icon">⚡</div>
                <div class="feature-text" data-i18n="feature.instant">Instant Results</div>
              </div>
              <div class="feature">
                <div class="feature-icon">📱</div>
                <div class="feature-text" data-i18n="feature.mobile">Mobile Ready</div>
              </div>
            </div>

            <!-- Payment Steps -->
            <div class="payment-steps">
              <div class="step" id="step1">
                <div class="step-number">1</div>
                <div class="step-text" data-i18n="step.name">Enter Name</div>
              </div>
              <div class="step" id="step2">
                <div class="step-number">2</div>
                <div class="step-text" data-i18n="step.payment">Payment</div>
              </div>
              <div class="step" id="step3">
                <div class="step-number">3</div>
                <div class="step-text" data-i18n="step.generate">Generate</div>
              </div>
            </div>

            <!-- Name Input Section -->
            <div class="name-section" id="nameSection">
              <form id="nameForm">
                <div class="form-group">
                  <input 
                    type="text" 
                    id="nameInput" 
                    name="name" 
                    data-i18n-placeholder="placeholder.name"
                    placeholder="Enter your full name" 
                    required
                    autocomplete="name"
                  />
                </div>
                
                <button type="submit" class="payment-btn" id="proceedBtn">
                  <span class="btn-text" data-i18n="button.proceed">Proceed to Payment</span>
                </button>
              </form>
            </div>

            <!-- Payment Section -->
            <div class="payment-section" id="paymentSection">
              <div class="payment-info">
                <div class="price" data-i18n="price.amount">$9.99</div>
                <div class="price-desc" data-i18n="price.desc">One-time payment for premium signature generation</div>
              </div>

              <div class="security-icon">🔒</div>
              <p data-i18n="payment.secure">Secure Payment Portal</p>
              
              <button class="payment-btn" id="payBtn" data-i18n="button.pay">
                💳 Pay Now
              </button>
            </div>

            <!-- PIN Verification Section -->
            <div class="pin-form" id="pinForm">
              <div class="security-icon">🔐</div>
              <h3 data-i18n="pin.title">Enter Security PIN</h3>
              <p data-i18n="pin.desc">Please enter your PIN to complete the payment</p>
              
              <form id="pinVerifyForm">
                <div class="form-group">
                  <input 
                    type="password" 
                    id="pinInput" 
                    class="pin-input"
                    data-i18n-placeholder="pin.placeholder"
                    placeholder="Enter PIN" 
                    required
                    maxlength="20"
                  />
                </div>
                
                <button type="submit" class="pin-btn" id="verifyBtn">
                  <span class="loading-spinner"></span>
                  <span class="btn-text" data-i18n="button.verify">Verify Payment</span>
                </button>
              </form>
            </div>

            <!-- Generation Section (after payment) -->
            <div class="generation-section" id="generationSection" style="display: none;">
              <button type="button" class="generate-btn" id="generateBtn">
                <span class="loading-spinner"></span>
                <span class="btn-text" data-i18n="button.generate">Generate My Signature</span>
              </button>

              <div class="progress-bar" id="progressBar">
                <div class="progress-fill"></div>
              </div>
            </div>

            <div class="error-message" id="errorMessage"></div>
            <div class="success-message" id="successMessage"></div>

            <div class="signature-container" id="signatureContainer">
              <img id="signatureImage" class="signature-image" alt="Generated signature" />
              <div>
                <button type="button" class="download-btn" id="downloadBtn" data-i18n="button.download">
                  📥 Download
                </button>
                <button type="button" class="regenerate-btn" id="regenerateBtn" data-i18n="button.tryAgain">
                  🔄 Try Again
                </button>
              </div>
            </div>
          </div>

          <script>
            // Internationalization
            const translations = {
              en: {
                title: '✨ AI Signature Generator',
                subtitle: 'Create beautiful, professional signatures powered by DALL-E 3',
                'feature.ai': 'AI-Powered',
                'feature.instant': 'Instant Results',
                'feature.mobile': 'Mobile Ready',
                'step.name': 'Enter Name',
                'step.payment': 'Payment',
                'step.generate': 'Generate',
                'placeholder.name': 'Enter your full name',
                'button.proceed': 'Proceed to Payment',
                'button.pay': '💳 Pay Now',
                'button.verify': 'Verify Payment',
                'button.generate': 'Generate My Signature',
                'button.download': '📥 Download',
                'button.tryAgain': '🔄 Try Again',
                'price.amount': '$9.99',
                'price.desc': 'One-time payment for premium signature generation',
                'payment.secure': 'Secure Payment Portal',
                'pin.title': 'Enter Security PIN',
                'pin.desc': 'Please enter your PIN to complete the payment',
                'pin.placeholder': 'Enter PIN',
                'loading.text': 'Generating Magic...',
                'loading.verify': 'Verifying...',
                'success.payment': '✅ Payment Successful! Generating your signature...',
                'error.nameRequired': 'Please enter your name',
                'error.nameLength': 'Name must be at least 2 characters long',
                'error.pinRequired': 'Please enter your PIN',
                'error.pinInvalid': 'Invalid PIN. Please try again.',
                'error.generation': 'Failed to generate signature. Please try again.',
                'error.unexpected': 'An unexpected error occurred. Please try again.'
              },
              zh: {
                title: '✨ AI 签名生成器',
                subtitle: '使用 DALL-E 3 AI 技术创建精美的专业签名',
                'feature.ai': 'AI 驱动',
                'feature.instant': '即时生成',
                'feature.mobile': '移动适配',
                'step.name': '输入姓名',
                'step.payment': '支付',
                'step.generate': '生成',
                'placeholder.name': '请输入您的姓名',
                'button.proceed': '前往支付',
                'button.pay': '💳 立即支付',
                'button.verify': '验证支付',
                'button.generate': '生成我的签名',
                'button.download': '📥 下载',
                'button.tryAgain': '🔄 重新生成',
                'price.amount': '￥68',
                'price.desc': '一次性付费，获得专业签名生成服务',
                'payment.secure': '安全支付门户',
                'pin.title': '输入安全PIN码',
                'pin.desc': '请输入您的PIN码以完成支付',
                'pin.placeholder': '输入PIN码',
                'loading.text': '正在生成中...',
                'loading.verify': '正在验证...',
                'success.payment': '✅ 支付成功！正在生成您的签名...',
                'error.nameRequired': '请输入您的姓名',
                'error.nameLength': '姓名至少需要2个字符',
                'error.pinRequired': '请输入PIN码',
                'error.pinInvalid': 'PIN码错误，请重试。',
                'error.generation': '生成签名失败，请重试。',
                'error.unexpected': '发生意外错误，请重试。'
              }
            };

            // Detect browser language and set default
            function detectLanguage() {
              const browserLang = navigator.language || navigator.languages[0];
              return browserLang.startsWith('zh') ? 'zh' : 'en';
            }

            let currentLanguage = detectLanguage();
            const CORRECT_PIN = 'Signature2024!';

            function updateLanguage(lang) {
              currentLanguage = lang;
              document.documentElement.lang = lang;
              
              // Update all translatable elements
              document.querySelectorAll('[data-i18n]').forEach(element => {
                const key = element.getAttribute('data-i18n');
                if (translations[lang][key]) {
                  element.textContent = translations[lang][key];
                }
              });

              // Update placeholders
              document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
                const key = element.getAttribute('data-i18n-placeholder');
                if (translations[lang][key]) {
                  element.placeholder = translations[lang][key];
                }
              });

              // Update language switcher
              document.querySelectorAll('.lang-btn').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
              });
            }

            // Initialize language
            updateLanguage(currentLanguage);

            // Language switcher event listeners
            document.querySelectorAll('.lang-btn').forEach(btn => {
              btn.addEventListener('click', () => {
                const lang = btn.getAttribute('data-lang');
                updateLanguage(lang);
              });
            });

            // Elements
            const nameForm = document.getElementById('nameForm');
            const pinVerifyForm = document.getElementById('pinVerifyForm');
            const nameInput = document.getElementById('nameInput');
            const pinInput = document.getElementById('pinInput');
            const proceedBtn = document.getElementById('proceedBtn');
            const payBtn = document.getElementById('payBtn');
            const verifyBtn = document.getElementById('verifyBtn');
            const generateBtn = document.getElementById('generateBtn');
            const downloadBtn = document.getElementById('downloadBtn');
            const regenerateBtn = document.getElementById('regenerateBtn');

            // Sections
            const nameSection = document.getElementById('nameSection');
            const paymentSection = document.getElementById('paymentSection');
            const pinForm = document.getElementById('pinForm');
            const generationSection = document.getElementById('generationSection');
            const signatureContainer = document.getElementById('signatureContainer');
            const progressBar = document.getElementById('progressBar');
            const errorMessage = document.getElementById('errorMessage');
            const successMessage = document.getElementById('successMessage');

            // Steps
            const step1 = document.getElementById('step1');
            const step2 = document.getElementById('step2');
            const step3 = document.getElementById('step3');

            let currentImageUrl = null;
            let currentName = '';

            function updateSteps(activeStep) {
              [step1, step2, step3].forEach((step, index) => {
                step.classList.remove('active', 'completed');
                if (index + 1 < activeStep) {
                  step.classList.add('completed');
                } else if (index + 1 === activeStep) {
                  step.classList.add('active');
                }
              });
            }

            function showError(message) {
              errorMessage.textContent = message;
              errorMessage.classList.add('show');
              successMessage.classList.remove('show');
              setTimeout(() => {
                errorMessage.classList.remove('show');
              }, 5000);
            }

            function showSuccess(message) {
              successMessage.textContent = message;
              successMessage.classList.add('show');
              errorMessage.classList.remove('show');
              setTimeout(() => {
                successMessage.classList.remove('show');
              }, 3000);
            }

            function setLoading(button, isLoading, loadingText = null) {
              button.disabled = isLoading;
              button.classList.toggle('loading', isLoading);
              
              if (isLoading && loadingText) {
                button.querySelector('.btn-text').textContent = loadingText;
              }
            }

            // Step 1: Name Input
            nameForm.addEventListener('submit', (e) => {
              e.preventDefault();
              const name = nameInput.value.trim();
              
              if (!name) {
                showError(translations[currentLanguage]['error.nameRequired']);
                nameInput.focus();
                return;
              }

              if (name.length < 2) {
                showError(translations[currentLanguage]['error.nameLength']);
                nameInput.focus();
                return;
              }

              currentName = name;
              
              // Move to payment step
              nameSection.classList.add('hide');
              paymentSection.classList.add('show');
              updateSteps(2);
              errorMessage.classList.remove('show');
            });

            // Step 2: Payment
            payBtn.addEventListener('click', () => {
              paymentSection.classList.remove('show');
              pinForm.classList.add('show');
              pinInput.focus();
            });

            // Step 3: PIN Verification
            pinVerifyForm.addEventListener('submit', async (e) => {
              e.preventDefault();
              const pin = pinInput.value.trim();
              
              if (!pin) {
                showError(translations[currentLanguage]['error.pinRequired']);
                pinInput.focus();
                return;
              }

              setLoading(verifyBtn, true, translations[currentLanguage]['loading.verify']);

              // Simulate verification delay
              setTimeout(() => {
                if (pin === CORRECT_PIN) {
                  // PIN is correct
                  showSuccess(translations[currentLanguage]['success.payment']);
                  pinForm.style.display = 'none';
                  generationSection.style.display = 'block';
                  updateSteps(3);
                  
                  // Auto-generate signature after payment success
                  setTimeout(() => {
                    generateSignature(currentName);
                  }, 1500);
                } else {
                  // PIN is incorrect
                  showError(translations[currentLanguage]['error.pinInvalid']);
                  pinInput.value = '';
                  pinInput.focus();
                }
                setLoading(verifyBtn, false);
                verifyBtn.querySelector('.btn-text').textContent = translations[currentLanguage]['button.verify'];
              }, 2000);
            });

            async function generateSignature(name) {
              try {
                setLoading(generateBtn, true, translations[currentLanguage]['loading.text']);
                progressBar.classList.add('show');
                signatureContainer.classList.remove('show');
                errorMessage.classList.remove('show');

                const response = await fetch('/generate', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ 
                    name: name.trim(),
                    language: currentLanguage
                  })
                });

                const data = await response.json();

                if (!response.ok) {
                  throw new Error(data.error || translations[currentLanguage]['error.generation']);
                }

                if (data.data && data.data[0] && data.data[0].url) {
                  currentImageUrl = data.data[0].url;
                  document.getElementById('signatureImage').src = currentImageUrl;
                  document.getElementById('signatureImage').alt = 'Signature for ' + name;
                  
                  // Show signature with animation
                  setTimeout(() => {
                    signatureContainer.classList.add('show');
                  }, 100);
                } else {
                  throw new Error(translations[currentLanguage]['error.unexpected']);
                }
              } catch (error) {
                console.error('Error generating signature:', error);
                showError(error.message || translations[currentLanguage]['error.generation']);
              } finally {
                setLoading(generateBtn, false);
                generateBtn.querySelector('.btn-text').textContent = translations[currentLanguage]['button.generate'];
                progressBar.classList.remove('show');
              }
            }

            function downloadImage() {
              if (!currentImageUrl) return;
              
              const link = document.createElement('a');
              link.href = currentImageUrl;
              link.download = 'signature-' + currentName.replace(/\\\\s+/g, '-').toLowerCase() + '.png';
              
              try {
                link.click();
              } catch (e) {
                window.open(currentImageUrl, '_blank');
              }
            }

            // Event listeners
            generateBtn.addEventListener('click', () => {
              if (currentName) {
                generateSignature(currentName);
              }
            });

            downloadBtn.addEventListener('click', downloadImage);

            regenerateBtn.addEventListener('click', () => {
              if (currentName) {
                generateSignature(currentName);
              }
            });

            // Auto-focus name input
            nameInput.focus();

            // Initialize steps
            updateSteps(1);

            // Real-time validation
            nameInput.addEventListener('input', () => {
              errorMessage.classList.remove('show');
            });

            pinInput.addEventListener('input', () => {
              errorMessage.classList.remove('show');
            });
          </script>
        </body>
      </html>`, 
      { 
        headers: { "Content-Type": "text/html" }
      }
    );
  }
}