class ModelPricingApp {
    constructor() {
        this.models = [];
        this.inputTokens = {};
        this.outputTokens = {};
        this.cacheKey = 'ai-model-pricing-cache';
        this.cacheExpiry = 24 * 60 * 60 * 1000;
        this.activeProvider = 'all';
        this.activeType = 'all';
        this.activeTable = 'pricing';
        this.tokenizers = {};
        this.selectedModel = null;
        
        this.init();
    }

    async init() {
        await this.initializeTokenizers();
        await this.loadPricing();
        this.setupEventListeners();
        this.setupTabListeners();
        this.setupDownloadListener();
        this.setupTokenizerTooltip();
        this.updateModelCounts();
        this.renderModels();
        this.calculateTokens();
        this.updateLastUpdated();
        this.renderChangelog();
        this.setupChangelogFilters();
        this.setupComparison();
    }

    async initializeTokenizers() {
        try {
            // Initialize OpenAI tokenizers
            if (typeof tiktoken !== 'undefined') {
                this.tokenizers.gpt4 = await tiktoken.encoding_for_model('gpt-4');
                this.tokenizers.gpt35 = await tiktoken.encoding_for_model('gpt-3.5-turbo');
            }
        } catch (error) {
            console.warn('Tiktoken not available, using approximation');
        }
    }

    async loadPricing() {
        this.models = this.getStaticPricingData();
        this.setCachedData(this.models);
    }

    getCachedData() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            return cached ? JSON.parse(cached) : null;
        } catch {
            return null;
        }
    }

    setCachedData(data) {
        const cacheData = {
            data: data,
            timestamp: Date.now()
        };
        localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
    }

    isCacheExpired(timestamp) {
        return Date.now() - timestamp > this.cacheExpiry;
    }

    getStaticPricingData() {
        return [
            // ===== AWS Bedrock (15 models) — reviewed Oct 2026 =====
            { name: "Claude Opus 4.5 (Bedrock)", provider: "AWS Bedrock", providerClass: "aws", contextLength: "1M", inputPrice: 0.005, outputPrice: 0.025, currency: "USD", per: "1K tokens", featured: true, symbol: "BCO45", docUrl: "https://aws.amazon.com/bedrock/pricing/" },
            { name: "Claude Sonnet 4.6 (Bedrock)", provider: "AWS Bedrock", providerClass: "aws", contextLength: "1M", inputPrice: 0.003, outputPrice: 0.015, currency: "USD", per: "1K tokens", symbol: "BCS46", docUrl: "https://aws.amazon.com/bedrock/pricing/" },
            { name: "Claude Haiku 4.5 (Bedrock)", provider: "AWS Bedrock", providerClass: "aws", contextLength: "200K", inputPrice: 0.001, outputPrice: 0.005, currency: "USD", per: "1K tokens", symbol: "BCH45", docUrl: "https://aws.amazon.com/bedrock/pricing/" },
            { name: "Amazon Nova Premier", provider: "AWS Bedrock", providerClass: "aws", contextLength: "1M", inputPrice: 0.0025, outputPrice: 0.0125, currency: "USD", per: "1K tokens", symbol: "ANPR", docUrl: "https://aws.amazon.com/nova/pricing/" },
            { name: "Amazon Nova Pro", provider: "AWS Bedrock", providerClass: "aws", contextLength: "300K", inputPrice: 0.0008, outputPrice: 0.0032, currency: "USD", per: "1K tokens", symbol: "ANP", docUrl: "https://aws.amazon.com/nova/pricing/" },
            { name: "Amazon Nova Lite", provider: "AWS Bedrock", providerClass: "aws", contextLength: "300K", inputPrice: 0.00006, outputPrice: 0.00024, currency: "USD", per: "1K tokens", symbol: "ANL", docUrl: "https://aws.amazon.com/nova/pricing/" },
            { name: "Amazon Nova Micro", provider: "AWS Bedrock", providerClass: "aws", contextLength: "128K", inputPrice: 0.000035, outputPrice: 0.00014, currency: "USD", per: "1K tokens", symbol: "ANM", docUrl: "https://aws.amazon.com/nova/pricing/" },
            { name: "Llama 4 Maverick (Bedrock)", provider: "AWS Bedrock", providerClass: "aws", contextLength: "1M", inputPrice: 0.00024, outputPrice: 0.00097, currency: "USD", per: "1K tokens", symbol: "L4MV", docUrl: "https://aws.amazon.com/bedrock/pricing/" },
            { name: "Llama 4 Scout (Bedrock)", provider: "AWS Bedrock", providerClass: "aws", contextLength: "3.5M", inputPrice: 0.00017, outputPrice: 0.00066, currency: "USD", per: "1K tokens", symbol: "L4SC", docUrl: "https://aws.amazon.com/bedrock/pricing/" },
            { name: "Llama 3.3 70B (Bedrock)", provider: "AWS Bedrock", providerClass: "aws", contextLength: "128K", inputPrice: 0.00072, outputPrice: 0.00072, currency: "USD", per: "1K tokens", symbol: "L3370", docUrl: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-meta.html" },
            { name: "DeepSeek-R1 (Bedrock)", provider: "AWS Bedrock", providerClass: "aws", contextLength: "128K", inputPrice: 0.00135, outputPrice: 0.0054, currency: "USD", per: "1K tokens", symbol: "DSR1", docUrl: "https://aws.amazon.com/bedrock/pricing/" },
            { name: "Mistral Large 2 (Bedrock)", provider: "AWS Bedrock", providerClass: "aws", contextLength: "128K", inputPrice: 0.002, outputPrice: 0.006, currency: "USD", per: "1K tokens", symbol: "BML2", docUrl: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-mistral.html" },
            { name: "Titan Text Premier", provider: "AWS Bedrock", providerClass: "aws", contextLength: "32K", inputPrice: 0.0005, outputPrice: 0.0015, currency: "USD", per: "1K tokens", symbol: "TTP", docUrl: "https://aws.amazon.com/bedrock/pricing/" },
            { name: "Cohere Command R+", provider: "AWS Bedrock", providerClass: "aws", contextLength: "128K", inputPrice: 0.0025, outputPrice: 0.01, currency: "USD", per: "1K tokens", symbol: "BCCR+", docUrl: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-cohere-command.html" },
            { name: "Stability AI SD3.5 Large", provider: "AWS Bedrock", providerClass: "aws", contextLength: "N/A", inputPrice: 0.08, outputPrice: 0.08, currency: "USD", per: "image", symbol: "SD35", docUrl: "https://aws.amazon.com/bedrock/pricing/" },

            // ===== Azure OpenAI (9 models) =====
            { name: "GPT-5.1 (Azure)", provider: "Azure OpenAI", providerClass: "azure", contextLength: "400K", inputPrice: 0.00125, outputPrice: 0.01, currency: "USD", per: "1K tokens", featured: true, symbol: "G51A", docUrl: "https://azure.microsoft.com/en-us/pricing/details/azure-openai/" },
            { name: "GPT-5.1 mini (Azure)", provider: "Azure OpenAI", providerClass: "azure", contextLength: "400K", inputPrice: 0.00025, outputPrice: 0.002, currency: "USD", per: "1K tokens", symbol: "G51MA", docUrl: "https://azure.microsoft.com/en-us/pricing/details/azure-openai/" },
            { name: "GPT-5.1 nano (Azure)", provider: "Azure OpenAI", providerClass: "azure", contextLength: "400K", inputPrice: 0.00005, outputPrice: 0.0004, currency: "USD", per: "1K tokens", symbol: "G51NA", docUrl: "https://azure.microsoft.com/en-us/pricing/details/azure-openai/" },
            { name: "o3 (Azure)", provider: "Azure OpenAI", providerClass: "azure", contextLength: "200K", inputPrice: 0.002, outputPrice: 0.008, currency: "USD", per: "1K tokens", symbol: "O3A", docUrl: "https://azure.microsoft.com/en-us/pricing/details/azure-openai/" },
            { name: "o4 mini (Azure)", provider: "Azure OpenAI", providerClass: "azure", contextLength: "200K", inputPrice: 0.0011, outputPrice: 0.0044, currency: "USD", per: "1K tokens", symbol: "O4MA", docUrl: "https://azure.microsoft.com/en-us/pricing/details/azure-openai/" },
            { name: "GPT-4.1 (Azure)", provider: "Azure OpenAI", providerClass: "azure", contextLength: "1M", inputPrice: 0.002, outputPrice: 0.008, currency: "USD", per: "1K tokens", symbol: "G41A", docUrl: "https://azure.microsoft.com/en-us/pricing/details/azure-openai/" },
            { name: "GPT-4.1 mini (Azure)", provider: "Azure OpenAI", providerClass: "azure", contextLength: "1M", inputPrice: 0.0004, outputPrice: 0.0016, currency: "USD", per: "1K tokens", symbol: "G41MA", docUrl: "https://azure.microsoft.com/en-us/pricing/details/azure-openai/" },
            { name: "GPT Image 1 (Azure)", provider: "Azure OpenAI", providerClass: "azure", contextLength: "N/A", inputPrice: 0.04, outputPrice: 0.04, currency: "USD", per: "image", symbol: "GI1A", docUrl: "https://azure.microsoft.com/en-us/pricing/details/azure-openai/" },
            { name: "Text Embedding 3 Large (Azure)", provider: "Azure OpenAI", providerClass: "azure", contextLength: "8K", inputPrice: 0.00013, outputPrice: 0.00013, currency: "USD", per: "1K tokens", symbol: "TE3LA", docUrl: "https://azure.microsoft.com/en-us/pricing/details/azure-openai/" },

            // ===== OpenAI (12 models) =====
            { name: "GPT-6 Astra", provider: "OpenAI", providerClass: "openai", contextLength: "400K", inputPrice: 0.01, outputPrice: 0.05, currency: "USD", per: "1K tokens", symbol: "G6A", docUrl: "https://developers.openai.com/api/docs/pricing/" },
            { name: "GPT-6.1 Sol", provider: "OpenAI", providerClass: "openai", contextLength: "400K", inputPrice: 0.002, outputPrice: 0.01, currency: "USD", per: "1K tokens", featured: true, symbol: "G61S", docUrl: "https://developers.openai.com/api/docs/pricing/" },
            { name: "GPT-6 Luna", provider: "OpenAI", providerClass: "openai", contextLength: "400K", inputPrice: 0.0001, outputPrice: 0.0005, currency: "USD", per: "1K tokens", symbol: "G6L", docUrl: "https://developers.openai.com/api/docs/pricing/" },
            { name: "GPT-5.6 Sol", provider: "OpenAI", providerClass: "openai", contextLength: "400K", inputPrice: 0.004, outputPrice: 0.02, currency: "USD", per: "1K tokens", symbol: "G56S", docUrl: "https://developers.openai.com/api/docs/pricing/" },
            { name: "GPT-5.3 Codex", provider: "OpenAI", providerClass: "openai", contextLength: "400K", inputPrice: 0.00175, outputPrice: 0.014, currency: "USD", per: "1K tokens", symbol: "G53CX", docUrl: "https://developers.openai.com/api/docs/pricing/" },
            { name: "GPT-4.1", provider: "OpenAI", providerClass: "openai", contextLength: "1M", inputPrice: 0.002, outputPrice: 0.008, currency: "USD", per: "1K tokens", symbol: "G41", docUrl: "https://platform.openai.com/docs/models" },
            { name: "GPT-4.1 mini", provider: "OpenAI", providerClass: "openai", contextLength: "1M", inputPrice: 0.0004, outputPrice: 0.0016, currency: "USD", per: "1K tokens", symbol: "G41M", docUrl: "https://platform.openai.com/docs/models" },
            { name: "o3", provider: "OpenAI", providerClass: "openai", contextLength: "200K", inputPrice: 0.002, outputPrice: 0.008, currency: "USD", per: "1K tokens", symbol: "O3", docUrl: "https://platform.openai.com/docs/models/o3" },
            { name: "o4 mini", provider: "OpenAI", providerClass: "openai", contextLength: "200K", inputPrice: 0.0011, outputPrice: 0.0044, currency: "USD", per: "1K tokens", symbol: "O4M", docUrl: "https://platform.openai.com/docs/models/o4-mini" },
            { name: "GPT Image 2.5", provider: "OpenAI", providerClass: "openai", contextLength: "N/A", inputPrice: 0.008, outputPrice: 0.03, currency: "USD", per: "1K tokens", symbol: "GI25", docUrl: "https://developers.openai.com/api/docs/pricing/" },
            { name: "GPT Transcribe", provider: "OpenAI", providerClass: "openai", contextLength: "N/A", inputPrice: 0.0045, outputPrice: 0.0045, currency: "USD", per: "minute", symbol: "GTR", docUrl: "https://developers.openai.com/api/docs/pricing/" },
            { name: "Text Embedding 3 Small", provider: "OpenAI", providerClass: "openai", contextLength: "8K", inputPrice: 0.00002, outputPrice: 0.00002, currency: "USD", per: "1K tokens", symbol: "TE3S", docUrl: "https://platform.openai.com/docs/models/embeddings" },

            // ===== Anthropic (8 models) =====
            { name: "Claude Opus 5.5", provider: "Anthropic", providerClass: "anthropic", contextLength: "1M", inputPrice: 0.004, outputPrice: 0.02, currency: "USD", per: "1K tokens", featured: true, symbol: "CO55", docUrl: "https://platform.claude.com/docs/en/about-claude/pricing" },
            { name: "Claude Sonnet 5.5", provider: "Anthropic", providerClass: "anthropic", contextLength: "1M", inputPrice: 0.002, outputPrice: 0.01, currency: "USD", per: "1K tokens", symbol: "CS55", docUrl: "https://platform.claude.com/docs/en/about-claude/pricing" },
            { name: "Claude Haiku 5.5", provider: "Anthropic", providerClass: "anthropic", contextLength: "200K", inputPrice: 0.0001, outputPrice: 0.0005, currency: "USD", per: "1K tokens", symbol: "CH55", docUrl: "https://platform.claude.com/docs/en/about-claude/pricing" },
            { name: "Claude Fable 5.1", provider: "Anthropic", providerClass: "anthropic", contextLength: "1M", inputPrice: 0.01, outputPrice: 0.05, currency: "USD", per: "1K tokens", symbol: "CF51", docUrl: "https://platform.claude.com/docs/en/about-claude/pricing" },
            { name: "Claude Opus 4.5", provider: "Anthropic", providerClass: "anthropic", contextLength: "1M", inputPrice: 0.005, outputPrice: 0.025, currency: "USD", per: "1K tokens", symbol: "CO45", docUrl: "https://platform.claude.com/docs/en/about-claude/pricing" },
            { name: "Claude Sonnet 4.5", provider: "Anthropic", providerClass: "anthropic", contextLength: "1M", inputPrice: 0.003, outputPrice: 0.015, currency: "USD", per: "1K tokens", symbol: "CS45", docUrl: "https://platform.claude.com/docs/en/about-claude/pricing" },
            { name: "Claude Haiku 4.5", provider: "Anthropic", providerClass: "anthropic", contextLength: "200K", inputPrice: 0.001, outputPrice: 0.005, currency: "USD", per: "1K tokens", symbol: "CH45", docUrl: "https://platform.claude.com/docs/en/about-claude/pricing" },
            { name: "Claude Haiku 3.5", provider: "Anthropic", providerClass: "anthropic", contextLength: "200K", inputPrice: 0.0008, outputPrice: 0.004, currency: "USD", per: "1K tokens", symbol: "CH35", docUrl: "https://platform.claude.com/docs/en/about-claude/pricing" },

            // ===== Mistral (8 models) =====
            { name: "Mistral Large 3", provider: "Mistral AI", providerClass: "mistral", contextLength: "256K", inputPrice: 0.002, outputPrice: 0.006, currency: "USD", per: "1K tokens", featured: true, symbol: "ML3", docUrl: "https://docs.mistral.ai/getting-started/models/" },
            { name: "Mistral Medium 3", provider: "Mistral AI", providerClass: "mistral", contextLength: "128K", inputPrice: 0.0004, outputPrice: 0.002, currency: "USD", per: "1K tokens", symbol: "MM3", docUrl: "https://docs.mistral.ai/getting-started/models/" },
            { name: "Mistral Small 3.2", provider: "Mistral AI", providerClass: "mistral", contextLength: "128K", inputPrice: 0.0001, outputPrice: 0.0003, currency: "USD", per: "1K tokens", symbol: "MS32", docUrl: "https://docs.mistral.ai/getting-started/models/" },
            { name: "Magistral Medium", provider: "Mistral AI", providerClass: "mistral", contextLength: "128K", inputPrice: 0.002, outputPrice: 0.005, currency: "USD", per: "1K tokens", symbol: "MGM", docUrl: "https://docs.mistral.ai/getting-started/models/" },
            { name: "Codestral 2 (25.08)", provider: "Mistral AI", providerClass: "mistral", contextLength: "256K", inputPrice: 0.0003, outputPrice: 0.0009, currency: "USD", per: "1K tokens", symbol: "CS2", docUrl: "https://docs.mistral.ai/getting-started/models/" },
            { name: "Mistral Embed", provider: "Mistral AI", providerClass: "mistral", contextLength: "8K", inputPrice: 0.0001, outputPrice: 0.0001, currency: "USD", per: "1K tokens", symbol: "ME", docUrl: "https://docs.mistral.ai/getting-started/models/" },
            { name: "Pixtral Large", provider: "Mistral AI", providerClass: "mistral", contextLength: "128K", inputPrice: 0.002, outputPrice: 0.006, currency: "USD", per: "1K tokens", symbol: "PXL", docUrl: "https://docs.mistral.ai/getting-started/models/" },
            { name: "Mistral Nemo", provider: "Mistral AI", providerClass: "mistral", contextLength: "128K", inputPrice: 0.00015, outputPrice: 0.00015, currency: "USD", per: "1K tokens", symbol: "MN", docUrl: "https://docs.mistral.ai/getting-started/models/" },

            // ===== Google Cloud / Vertex AI (12 models) =====
            { name: "Gemini 3.1 Pro", provider: "Google Cloud", providerClass: "gcp", contextLength: "1M", inputPrice: 0.00125, outputPrice: 0.01, currency: "USD", per: "1K tokens", featured: true, symbol: "G31P", docUrl: "https://ai.google.dev/gemini-api/docs/pricing" },
            { name: "Gemini 3 Pro", provider: "Google Cloud", providerClass: "gcp", contextLength: "1M", inputPrice: 0.002, outputPrice: 0.012, currency: "USD", per: "1K tokens", symbol: "G3P", docUrl: "https://ai.google.dev/gemini-api/docs/pricing" },
            { name: "Gemini 3.8 Flash", provider: "Google Cloud", providerClass: "gcp", contextLength: "1M", inputPrice: 0.00075, outputPrice: 0.00375, currency: "USD", per: "1K tokens", symbol: "G38F", docUrl: "https://ai.google.dev/gemini-api/docs/pricing" },
            { name: "Gemini 3 Flash", provider: "Google Cloud", providerClass: "gcp", contextLength: "1M", inputPrice: 0.0005, outputPrice: 0.003, currency: "USD", per: "1K tokens", symbol: "G3F", docUrl: "https://ai.google.dev/gemini-api/docs/pricing" },
            { name: "Gemini 3.1 Flash-Lite", provider: "Google Cloud", providerClass: "gcp", contextLength: "1M", inputPrice: 0.00025, outputPrice: 0.0015, currency: "USD", per: "1K tokens", symbol: "G31FL", docUrl: "https://ai.google.dev/gemini-api/docs/pricing" },
            { name: "Claude Opus 4.5 (Vertex AI)", provider: "Google Cloud", providerClass: "gcp", contextLength: "1M", inputPrice: 0.005, outputPrice: 0.025, currency: "USD", per: "1K tokens", symbol: "VCO45", docUrl: "https://cloud.google.com/vertex-ai/generative-ai/pricing" },
            { name: "Claude Sonnet 4.5 (Vertex AI)", provider: "Google Cloud", providerClass: "gcp", contextLength: "1M", inputPrice: 0.003, outputPrice: 0.015, currency: "USD", per: "1K tokens", symbol: "VCS45", docUrl: "https://cloud.google.com/vertex-ai/generative-ai/pricing" },
            { name: "Llama 4 Maverick (Vertex AI)", provider: "Google Cloud", providerClass: "gcp", contextLength: "1M", inputPrice: 0.00035, outputPrice: 0.00115, currency: "USD", per: "1K tokens", symbol: "VL4M", docUrl: "https://cloud.google.com/vertex-ai/generative-ai/pricing" },
            { name: "Cohere Command R+ (Vertex AI)", provider: "Google Cloud", providerClass: "gcp", contextLength: "128K", inputPrice: 0.0025, outputPrice: 0.01, currency: "USD", per: "1K tokens", symbol: "CCR+", docUrl: "https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/cohere" },
            { name: "Imagen 4 (Vertex AI)", provider: "Google Cloud", providerClass: "gcp", contextLength: "N/A", inputPrice: 0.04, outputPrice: 0.04, currency: "USD", per: "image", symbol: "IMG4", docUrl: "https://cloud.google.com/vertex-ai/generative-ai/pricing" },
            { name: "Veo 3 (Vertex AI)", provider: "Google Cloud", providerClass: "gcp", contextLength: "N/A", inputPrice: 0.4, outputPrice: 0.4, currency: "USD", per: "second", symbol: "VEO3", docUrl: "https://cloud.google.com/vertex-ai/generative-ai/pricing" },
            { name: "Text Embedding 005", provider: "Google Cloud", providerClass: "gcp", contextLength: "2K", inputPrice: 0.00001, outputPrice: 0.00001, currency: "USD", per: "1K tokens", symbol: "TE5", docUrl: "https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings/get-text-embeddings" },
        ];
    }

    setupEventListeners() {
        const inputText = document.getElementById('input-text');
        const outputText = document.getElementById('output-text');
        inputText.addEventListener('input', () => this.calculateTokens());
        outputText.addEventListener('input', () => this.calculateTokens());
    }

    setupTokenizerTooltip() {
        const infoIcon = document.querySelector('.info-icon');
        const tooltip = document.getElementById('token-info-tooltip');
        
        infoIcon.addEventListener('click', (e) => {
            e.preventDefault();
            tooltip.style.display = tooltip.style.display === 'block' ? 'none' : 'block';
        });
        
        document.addEventListener('click', (e) => {
            if (!infoIcon.contains(e.target) && !tooltip.contains(e.target)) {
                tooltip.style.display = 'none';
            }
        });
        
        // Tokenization accordion
        const tokenHeader = document.getElementById('tokenization-header');
        const tokenContent = document.getElementById('tokenization-content');
        
        tokenHeader.addEventListener('click', () => {
            tokenHeader.classList.toggle('expanded');
            tokenContent.classList.toggle('expanded');
        });
    }

    calculateTokens() {
        const inputText = document.getElementById('input-text').value;
        const outputText = document.getElementById('output-text').value;
        
        // Calculate tokens for each provider
        this.inputTokens = {
            openai: this.tokenizeOpenAI(inputText),
            anthropic: this.tokenizeAnthropic(inputText),
            aws: this.tokenizeAWS(inputText),
            azure: this.tokenizeOpenAI(inputText),
            gcp: this.tokenizeGCP(inputText),
            mistral: this.tokenizeMistral(inputText)
        };
        
        this.outputTokens = {
            openai: this.tokenizeOpenAI(outputText),
            anthropic: this.tokenizeAnthropic(outputText),
            aws: this.tokenizeAWS(outputText),
            azure: this.tokenizeOpenAI(outputText),
            gcp: this.tokenizeGCP(outputText),
            mistral: this.tokenizeMistral(outputText)
        };
        
        this.updateDefaultTokenDisplay();
        this.updatePricing();
    }

    updateDefaultTokenDisplay() {
        // Always show token count with model name
        // Priority: selectedModel (user clicked) > first favorite > first visible model
        let topModel = null;

        // 1. User explicitly selected a model
        if (this.selectedModel) {
            topModel = this.selectedModel;
        }

        // 2. First favorite model
        if (!topModel) {
            const favs = this.getFavorites();
            if (favs.length > 0) {
                topModel = this.models.find(m => favs.includes(m.symbol));
            }
        }

        // 3. First model in current filtered list
        if (!topModel) {
            let filtered = this.models;
            if (this.activeProvider !== 'all') {
                filtered = filtered.filter(m => m.providerClass === this.activeProvider);
            }
            topModel = filtered[0];
        }

        if (!topModel) return;

        const provider = topModel.providerClass;
        const inCount = this.inputTokens[provider] || 0;
        const outCount = this.outputTokens[provider] || 0;

        document.getElementById('input-tokens').innerHTML = `${inCount} <span class="token-model-hint">(${topModel.name})</span>`;
        document.getElementById('output-tokens').innerHTML = `${outCount} <span class="token-model-hint">(${topModel.name})</span>`;
    }

    tokenizeOpenAI(text) {
        if (this.tokenizers.gpt4) {
            return this.tokenizers.gpt4.encode(text).length;
        }
        // Fallback: OpenAI approximation (more accurate than /4)
        return Math.ceil(text.length / 3.5);
    }

    tokenizeAnthropic(text) {
        // Anthropic uses similar tokenization to OpenAI but slightly different
        // Approximation based on Claude's tokenizer behavior
        return Math.ceil(text.length / 3.8);
    }

    tokenizeAWS(text) {
        // AWS Bedrock varies by model family
        // Claude models: similar to Anthropic
        // Llama models: different tokenization
        // Titan: Amazon's proprietary
        return Math.ceil(text.length / 3.6);
    }

    tokenizeGCP(text) {
        // Google's tokenization (PaLM/Gemini)
        // Generally more efficient than OpenAI
        return Math.ceil(text.length / 4.2);
    }

    tokenizeMistral(text) {
        // Mistral uses SentencePiece-based tokenization, similar ratio to Anthropic
        return Math.ceil(text.length / 3.8);
    }

    updatePricing() {
        const modelElements = document.querySelectorAll('.model-element');
        let filteredModels = this.models;
        if (this.activeProvider !== 'all') {
            filteredModels = filteredModels.filter(model => model.providerClass === this.activeProvider);
        }
        const favs = this.getFavorites();
        filteredModels = [...filteredModels].sort((a, b) => {
            const aFav = favs.includes(a.symbol) ? 1 : 0;
            const bFav = favs.includes(b.symbol) ? 1 : 0;
            return bFav - aFav;
        });
        modelElements.forEach((element, index) => {
            const model = filteredModels[index];
            if (model) {
                // Get provider-specific token counts
                const provider = model.providerClass;
                const inputTokens = this.inputTokens[provider] || this.inputTokens.openai;
                const outputTokens = this.outputTokens[provider] || this.outputTokens.openai;
                
                const inputCost = (inputTokens / 1000) * model.inputPrice;
                const outputCost = (outputTokens / 1000) * model.outputPrice;
                const totalCost = inputCost + outputCost;
                const totalCostEl = element.querySelector('.cost-amount');
                if (totalCostEl) totalCostEl.textContent = `$${totalCost.toFixed(6)}`;
            }
        });
    }

    renderModels() {
        const grid = document.getElementById('models-periodic');
        let filteredModels = this.models;
        if (this.activeProvider !== 'all') {
            filteredModels = filteredModels.filter(model => model.providerClass === this.activeProvider);
        }

        // Sort: favorites first
        const favs = this.getFavorites();
        filteredModels = [...filteredModels].sort((a, b) => {
            const aFav = favs.includes(a.symbol) ? 1 : 0;
            const bFav = favs.includes(b.symbol) ? 1 : 0;
            return bFav - aFav;
        });

        grid.innerHTML = filteredModels.map(model => {
            const isFav = favs.includes(model.symbol);
            return `
            <div class="model-element ${model.providerClass} ${model.featured ? 'featured' : ''} ${isFav ? 'is-fav' : ''} ${this.selectedModel && this.selectedModel.symbol === model.symbol ? 'selected' : ''}" data-provider="${model.providerClass}" data-symbol="${model.symbol}">
                <button class="fav-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); app.toggleFavorite('${model.symbol}')" title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">${isFav ? '★' : '☆'}</button>
                <a href="${model.docUrl}" target="_blank" class="element-name-link">
                    <div class="element-name">${model.name || 'Unknown'}</div>
                </a>
                <div class="element-provider">${model.provider || 'Unknown'}</div>
                <div class="element-specs">
                    <div class="spec-line">Context: ${model.contextLength || 'N/A'}</div>
                    <div class="spec-line">Input: $${model.inputPrice || 0}/${model.per || '1K tokens'}</div>
                    <div class="spec-line">Output: $${model.outputPrice || 0}/${model.per || '1K tokens'}</div>
                </div>
                <div class="element-cost">
                    <div class="cost-label">Your Cost</div>
                    <div class="cost-amount">$0.000000</div>
                </div>
                <div class="token-info" style="display:none; position:absolute; background:#333; color:white; padding:8px; border-radius:4px; font-size:12px; z-index:1000;">
                    <div>Input: <span class="hover-input-tokens">0</span> tokens</div>
                    <div>Output: <span class="hover-output-tokens">0</span> tokens</div>
                </div>
            </div>
        `;
        }).join('');
        
        // Add hover and click listeners
        const modelElements = document.querySelectorAll('.model-element');
        modelElements.forEach((element, index) => {
            const provider = element.dataset.provider;
            const symbol = element.dataset.symbol;
            const model = filteredModels[index];
            const tokenInfo = element.querySelector('.token-info');
            const inputSpan = element.querySelector('.hover-input-tokens');
            const outputSpan = element.querySelector('.hover-output-tokens');
            
            element.addEventListener('mouseenter', () => {
                const inCount = this.inputTokens[provider] || 0;
                const outCount = this.outputTokens[provider] || 0;
                inputSpan.textContent = inCount;
                outputSpan.textContent = outCount;
                tokenInfo.style.display = 'block';
                tokenInfo.style.left = '10px';
                tokenInfo.style.top = '10px';
                
                // Update main token display with model name
                document.getElementById('input-tokens').innerHTML = `${inCount} <span class="token-model-hint">(${model.name})</span>`;
                document.getElementById('output-tokens').innerHTML = `${outCount} <span class="token-model-hint">(${model.name})</span>`;
            });
            
            element.addEventListener('mouseleave', () => {
                tokenInfo.style.display = 'none';
                this.updateDefaultTokenDisplay();
            });

            // Click to pin model as selected
            element.addEventListener('click', (e) => {
                if (e.target.closest('.fav-btn') || e.target.closest('.element-name-link')) return;
                this.selectedModel = model;
                modelElements.forEach(el => el.classList.remove('selected'));
                element.classList.add('selected');
                this.updateDefaultTokenDisplay();
            });
        });
        
        this.updatePricing();
    }

    setupDownloadListener() {
        const downloadMd = document.getElementById('download-md');
        const downloadPdf = document.getElementById('download-pdf');
        downloadMd.addEventListener('click', (e) => {
            e.preventDefault();
            this.downloadPricingReport('md');
        });
        downloadPdf.addEventListener('click', (e) => {
            e.preventDefault();
            this.downloadPricingReport('pdf');
        });
    }

    downloadPricingReport(format = 'md') {
        const inputText = document.getElementById('input-text').value;
        const outputText = document.getElementById('output-text').value;
        const inputTokens = this.inputTokens;
        const outputTokens = this.outputTokens;
        const activeProvider = this.activeProvider;
        
        let filteredModels = this.models;
        if (activeProvider !== 'all') {
            filteredModels = filteredModels.filter(model => model.providerClass === activeProvider);
        }
        
        if (format === 'pdf') {
            this.downloadPDF(inputText, outputText, inputTokens, outputTokens, filteredModels, activeProvider);
        } else {
            const reportContent = this.generateMarkdownReport(inputText, outputText, inputTokens, outputTokens, filteredModels, activeProvider);
            const blob = new Blob([reportContent], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ai-pricing-report-${new Date().toISOString().split('T')[0]}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    downloadPDF(inputText, outputText, inputTokens, outputTokens, models, provider) {
        const reportContent = this.generateMarkdownReport(inputText, outputText, inputTokens, outputTokens, models, provider);
        
        // Convert markdown to HTML for PDF
        const htmlContent = this.markdownToHTML(reportContent);
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>AI Pricing Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        pre { background: #f5f5f5; padding: 10px; border-radius: 4px; }
                        h1, h2 { color: #333; }
                    </style>
                </head>
                <body>${htmlContent}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    markdownToHTML(markdown) {
        return markdown
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/```([\s\S]*?)```/g, '<pre>$1</pre>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(.*)$/gm, '<p>$1</p>')
            .replace(/<p><\/p>/g, '')
            .replace(/\|(.*)\|/g, (match) => {
                const cells = match.split('|').filter(cell => cell.trim());
                const isHeader = match.includes('---');
                if (isHeader) return '';
                const tag = cells[0].includes('Model') ? 'th' : 'td';
                return `<tr>${cells.map(cell => `<${tag}>${cell.trim()}</${tag}>`).join('')}</tr>`;
            })
            .replace(/(<tr>.*<\/tr>)/g, '<table>$1</table>')
            .replace(/<table>([\s\S]*?)<\/table>/g, (match, content) => {
                return `<table>${content}</table>`;
            });
    }

    generateMarkdownReport(inputText, outputText, inputTokens, outputTokens, models, provider) {
        const date = new Date().toLocaleDateString();
        const providerName = provider === 'all' ? 'All Providers' : provider.toUpperCase();
        
        // Use provider-specific tokens for report
        const reportInputTokens = provider === 'all' ? 
            Math.round(Object.values(this.inputTokens).reduce((a, b) => a + b, 0) / Object.values(this.inputTokens).length) :
            this.inputTokens[provider];
        const reportOutputTokens = provider === 'all' ? 
            Math.round(Object.values(this.outputTokens).reduce((a, b) => a + b, 0) / Object.values(this.outputTokens).length) :
            this.outputTokens[provider];
        
        let markdown = `# AI Model Pricing Report\n\n`;
        markdown += `**Generated:** ${date}\n`;
        markdown += `**Provider Filter:** ${providerName}\n`;
        markdown += `**Input Tokens:** ${reportInputTokens}\n`;
        markdown += `**Output Tokens:** ${reportOutputTokens}\n`;
        markdown += `**Total Tokens:** ${reportInputTokens + reportOutputTokens}\n\n`;
        
        markdown += `## Input Text\n\n`;
        markdown += `\`\`\`\n${inputText}\n\`\`\`\n\n`;
        
        markdown += `## Expected Output\n\n`;
        markdown += `\`\`\`\n${outputText}\n\`\`\`\n\n`;
        
        markdown += `## Pricing Comparison\n\n`;
        markdown += `| Model | Provider | Input Price | Output Price | Your Cost | Context Length |\n`;
        markdown += `|-------|----------|-------------|--------------|-----------|----------------|\n`;
        
        models.forEach(model => {
            const modelProvider = model.providerClass;
            const modelInputTokens = this.inputTokens[modelProvider] || reportInputTokens;
            const modelOutputTokens = this.outputTokens[modelProvider] || reportOutputTokens;
            
            const inputCost = (modelInputTokens / 1000) * model.inputPrice;
            const outputCost = (modelOutputTokens / 1000) * model.outputPrice;
            const totalCost = inputCost + outputCost;
            
            markdown += `| ${model.name} | ${model.provider} | $${model.inputPrice}/${model.per} | $${model.outputPrice}/${model.per} | $${totalCost.toFixed(6)} | ${model.contextLength} |\n`;
        });
        
        markdown += `\n## Summary\n\n`;
        const costs = models.map(model => {
            const modelProvider = model.providerClass;
            const modelInputTokens = this.inputTokens[modelProvider] || reportInputTokens;
            const modelOutputTokens = this.outputTokens[modelProvider] || reportOutputTokens;
            
            const inputCost = (modelInputTokens / 1000) * model.inputPrice;
            const outputCost = (modelOutputTokens / 1000) * model.outputPrice;
            return inputCost + outputCost;
        });
        
        const minCost = Math.min(...costs);
        const maxCost = Math.max(...costs);
        const avgCost = costs.reduce((a, b) => a + b, 0) / costs.length;
        
        markdown += `- **Cheapest Option:** $${minCost.toFixed(6)}\n`;
        markdown += `- **Most Expensive:** $${maxCost.toFixed(6)}\n`;
        markdown += `- **Average Cost:** $${avgCost.toFixed(6)}\n`;
        markdown += `- **Cost Range:** ${((maxCost - minCost) / minCost * 100).toFixed(1)}% difference\n\n`;
        
        markdown += `## Tokenization Details\n\n`;
        markdown += `Different providers use different tokenization methods:\n\n`;
        Object.entries(this.inputTokens).forEach(([provider, tokens]) => {
            markdown += `- **${provider.toUpperCase()}:** ${tokens} input tokens, ${this.outputTokens[provider]} output tokens\n`;
        });
        
        markdown += `\n## Recommendations\n\n`;
        const cheapestModel = models[costs.indexOf(minCost)];
        markdown += `- **Most Cost-Effective:** ${cheapestModel.name} (${cheapestModel.provider})\n`;
        
        const highContextModels = models.filter(m => {
            const contextNum = parseInt(m.contextLength.replace(/[^0-9]/g, ''));
            return contextNum >= 100;
        });
        if (highContextModels.length > 0) {
            markdown += `- **Best for Long Context:** ${highContextModels[0].name} (${highContextModels[0].contextLength})\n`;
        }
        
        markdown += `\n---\n\n`;
        markdown += `*Report generated by [AI Model Pricing Calculator](https://copilot-founder.github.io/ai-model-pricing/)*\n`;
        markdown += `*Pricing uses provider-specific tokenization for accuracy*`;
        
        return markdown;
    }

    updateModelCounts() {
        const counts = {
            all: this.models.length,
            aws: this.models.filter(m => m.providerClass === 'aws').length,
            azure: this.models.filter(m => m.providerClass === 'azure').length,
            openai: this.models.filter(m => m.providerClass === 'openai').length,
            anthropic: this.models.filter(m => m.providerClass === 'anthropic').length,
            gcp: this.models.filter(m => m.providerClass === 'gcp').length,
            mistral: this.models.filter(m => m.providerClass === 'mistral').length
        };
        
        Object.entries(counts).forEach(([provider, count]) => {
            const countEl = document.getElementById(`${provider}-count`);
            if (countEl) countEl.textContent = count;
        });
    }

    updateLastUpdated() {
        // Fixed date the pricing dataset was last reviewed against official docs.
        const element = document.getElementById('calc-last-updated');
        if (element) {
            element.textContent = this.reviewedDate;
        }
    }

    // Date the dataset was last verified against official provider pricing pages.
    get reviewedDate() { return 'October 17, 2026'; }

    // Price-change history (per 1M tokens for readability). Most recent first.
    // direction: "down" = cut, "up" = increase, "new" = launch, "retired" = removed.
    getChangelog() {
        return [
            { date: "2026-10-07", provider: "Anthropic", providerClass: "anthropic", model: "Claude Haiku 5.5", direction: "new", note: "Fast, high-volume tier launched at $0.10 / $0.50 per MTok — about 90% cheaper than Haiku 4.5.", from: "—", to: "$0.10 / $0.50" },
            { date: "2026-09-28", provider: "Anthropic", providerClass: "anthropic", model: "Claude Sonnet 5.5", direction: "new", note: "Mid-tier launched at $2 / $10 per MTok, typically using far fewer tokens per task than Sonnet 4.5.", from: "—", to: "$2.00 / $10.00" },
            { date: "2026-09-23", provider: "OpenAI", providerClass: "openai", model: "GPT-6.1 Sol", direction: "down", note: "Mid-tier priced at $2 / $10 per MTok — half of GPT-5.6 Sol's $4 / $20.", from: "$4.00 / $20.00", to: "$2.00 / $10.00" },
            { date: "2026-09-22", provider: "Anthropic", providerClass: "anthropic", model: "Claude Opus 5.5", direction: "down", note: "New flagship at $4 / $20 per MTok, 20% below Opus 5; cache reads down 60% to $0.20.", from: "$5.00 / $25.00", to: "$4.00 / $20.00" },
            { date: "2026-09-03", provider: "OpenAI", providerClass: "openai", model: "GPT-6 Astra", direction: "new", note: "Top-end flagship launched at $10 / $50 per MTok (1M context window).", from: "—", to: "$10.00 / $50.00" },
            { date: "2026-09-02", provider: "Google Cloud", providerClass: "gcp", model: "Gemini 3.8 Flash", direction: "new", note: "Introductory pricing $0.75 / $3.75 per MTok (rate doubles Jan 1, 2027).", from: "—", to: "$0.75 / $3.75" },
            { date: "2026-08-01", provider: "AWS Bedrock", providerClass: "aws", model: "Amazon Nova Lite", direction: "down", note: "Reduced to $0.06 / $0.24 per MTok for high-volume multimodal workloads.", from: "$0.20 / $0.80", to: "$0.06 / $0.24" },
            { date: "2026-07-30", provider: "OpenAI", providerClass: "openai", model: "GPT-6 Luna", direction: "down", note: "Budget tier cut ~80% to $0.10 / $0.50 per MTok.", from: "$0.50 / $3.00", to: "$0.10 / $0.50" },
            { date: "2026-06-29", provider: "Google Cloud", providerClass: "gcp", model: "Gemini 3.1 Pro", direction: "new", note: "Context-tiered Pro model from $1.25 / $10 per MTok (≤200K prompt).", from: "—", to: "$1.25 / $10.00" },
            { date: "2026-06-15", provider: "AWS Bedrock", providerClass: "aws", model: "Claude Opus 4.5 (Bedrock)", direction: "new", note: "Available on Bedrock at $5 / $25 per MTok with a 1M context window.", from: "—", to: "$5.00 / $25.00" },
            { date: "2026-10-02", provider: "Google Cloud", providerClass: "gcp", model: "Gemini 2.5 family", direction: "retired", note: "Gemini 2.5 / 2.0 / 1.5 models retired from the API; replaced by Gemini 3.x.", from: "—", to: "Retired" },
            { date: "2026-10-01", provider: "Azure OpenAI", providerClass: "azure", model: "GPT-4o (Azure)", direction: "retired", note: "GPT-4o Global Standard retired on Azure; auto-upgraded to GPT-5.1.", from: "—", to: "Retired" }
        ];
    }

    setupTabListeners() {
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                this.activeProvider = button.dataset.provider;
                this.renderModels();
            });
        });
    }



    // ===== Price Changelog =====
    renderChangelog() {
        const list = document.getElementById('changelog-list');
        if (!list) return;
        const meta = {
            down: { icon: '▼', label: 'Price cut', cls: 'cl-down' },
            up: { icon: '▲', label: 'Increase', cls: 'cl-up' },
            new: { icon: '✦', label: 'New model', cls: 'cl-new' },
            retired: { icon: '✕', label: 'Retired', cls: 'cl-retired' }
        };
        const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        const fmt = iso => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

        this._changelog = this.getChangelog();
        const render = (filter) => {
            const rows = this._changelog.filter(e => filter === 'all' || e.providerClass === filter);
            if (!rows.length) { list.innerHTML = '<p class="changelog-empty">No changes recorded for this provider.</p>'; return; }
            list.innerHTML = rows.map(e => {
                const m = meta[e.direction] || meta.new;
                return `
                <div class="changelog-item ${e.providerClass}">
                    <div class="cl-marker ${m.cls}" title="${m.label}">${m.icon}</div>
                    <div class="cl-body">
                        <div class="cl-head">
                            <time>${fmt(e.date)}</time>
                            <span class="cl-badge ${m.cls}">${m.label}</span>
                            <span class="cl-provider">${esc(e.provider)}</span>
                        </div>
                        <div class="cl-model">${esc(e.model)}</div>
                        <p class="cl-note">${esc(e.note)}</p>
                        <div class="cl-prices"><span class="cl-from">${esc(e.from)}</span><span class="cl-arrow">→</span><span class="cl-to">${esc(e.to)}</span><span class="cl-unit">per 1M tokens (in / out)</span></div>
                    </div>
                </div>`;
            }).join('');
        };
        this._renderChangelog = render;
        render('all');
    }

    setupChangelogFilters() {
        const btns = document.querySelectorAll('.cl-filter');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (this._renderChangelog) this._renderChangelog(btn.dataset.clprovider);
            });
        });
    }

    // ===== Model Comparison =====
    setupComparison() {
        const selA = document.getElementById('cmp-a');
        const selB = document.getElementById('cmp-b');
        if (!selA || !selB) return;

        // Populate dropdowns with text LLMs (per 1K tokens) grouped by provider.
        const textModels = this.models.filter(m => m.per === '1K tokens');
        const optsHtml = ['<option value="">Select a model…</option>']
            .concat(textModels.map(m => `<option value="${m.symbol}">${m.name} — ${m.provider}</option>`))
            .join('');
        selA.innerHTML = optsHtml;
        selB.innerHTML = optsHtml;

        // Sensible defaults: two popular flagships.
        const defA = this.models.find(m => m.symbol === 'G61S') || textModels[0];
        const defB = this.models.find(m => m.symbol === 'CO55') || textModels[1];
        if (defA) selA.value = defA.symbol;
        if (defB) selB.value = defB.symbol;

        const update = () => this.renderComparison(selA.value, selB.value);
        selA.addEventListener('change', update);
        selB.addEventListener('change', update);
        const swap = document.getElementById('cmp-swap');
        if (swap) swap.addEventListener('click', () => { const t = selA.value; selA.value = selB.value; selB.value = t; update(); });
        update();
    }

    renderComparison(symA, symB) {
        const out = document.getElementById('cmp-result');
        if (!out) return;
        const a = this.models.find(m => m.symbol === symA);
        const b = this.models.find(m => m.symbol === symB);
        if (!a || !b) { out.innerHTML = '<p class="cmp-hint">Pick two models to compare their pricing side by side.</p>'; return; }

        const perM = p => {
            const v = p * 1000;
            if (v === 0) return '$0';
            if (v < 0.1) return '$' + v.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
            return '$' + v.toFixed(2).replace(/\.00$/, '');
        };
        const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

        // Verdict on blended input+output per token.
        const aTot = a.inputPrice + a.outputPrice, bTot = b.inputPrice + b.outputPrice;
        const cheaper = aTot <= bTot ? a : b, pricier = aTot <= bTot ? b : a;
        const pct = (pricier.inputPrice + pricier.outputPrice) > 0
            ? Math.round((1 - (cheaper.inputPrice + cheaper.outputPrice) / (pricier.inputPrice + pricier.outputPrice)) * 100) : 0;

        const win = (x, y) => x < y ? 'cmp-win' : '';
        out.innerHTML = `
            <div class="cmp-cards">
                <div class="cmp-card ${a.providerClass}">
                    <div class="cmp-card-name">${esc(a.name)}</div>
                    <div class="cmp-card-provider">${esc(a.provider)}</div>
                    <div class="cmp-row"><span>Input / 1M</span><span class="cmp-val ${win(a.inputPrice, b.inputPrice)}">${perM(a.inputPrice)}</span></div>
                    <div class="cmp-row"><span>Output / 1M</span><span class="cmp-val ${win(a.outputPrice, b.outputPrice)}">${perM(a.outputPrice)}</span></div>
                    <div class="cmp-row"><span>Context</span><span class="cmp-val">${esc(a.contextLength)}</span></div>
                </div>
                <div class="cmp-vs">VS</div>
                <div class="cmp-card ${b.providerClass}">
                    <div class="cmp-card-name">${esc(b.name)}</div>
                    <div class="cmp-card-provider">${esc(b.provider)}</div>
                    <div class="cmp-row"><span>Input / 1M</span><span class="cmp-val ${win(b.inputPrice, a.inputPrice)}">${perM(b.inputPrice)}</span></div>
                    <div class="cmp-row"><span>Output / 1M</span><span class="cmp-val ${win(b.outputPrice, a.outputPrice)}">${perM(b.outputPrice)}</span></div>
                    <div class="cmp-row"><span>Context</span><span class="cmp-val">${esc(b.contextLength)}</span></div>
                </div>
            </div>
            <div class="cmp-verdict"><strong>${esc(cheaper.name)}</strong> is about <strong>${pct}% cheaper</strong> than ${esc(pricier.name)} on a blended input+output basis. Enter your prompt in the calculator above to compare the exact cost for your workload.</div>`;
    }

    getModelType(model) {
        const name = model.name.toLowerCase();
        if (name.includes('gpt-4') || name.includes('gpt4')) return 'gpt4';
        if (name.includes('gpt-3.5') || name.includes('gpt3')) return 'gpt35';
        if (name.includes('claude 3')) return 'claude3';
        if (name.includes('llama 2') || name.includes('llama2')) return 'llama2';
        if (name.includes('dall-e') || name.includes('imagen') || name.includes('stability') || name.includes('diffusion')) return 'image';
        return 'other';
    }

    getFavorites() {
        try {
            return JSON.parse(localStorage.getItem('ai-pricing-favs') || '[]');
        } catch { return []; }
    }

    toggleFavorite(symbol) {
        let favs = this.getFavorites();
        if (favs.includes(symbol)) {
            favs = favs.filter(f => f !== symbol);
            // If unfavorited the selected model, clear selection
            if (this.selectedModel && this.selectedModel.symbol === symbol) {
                this.selectedModel = null;
            }
        } else {
            favs.push(symbol);
            // Set newly favorited model as selected
            this.selectedModel = this.models.find(m => m.symbol === symbol) || null;
        }
        localStorage.setItem('ai-pricing-favs', JSON.stringify(favs));
        this.renderModels();
        this.updateDefaultTokenDisplay();
    }
}

let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ModelPricingApp();
});