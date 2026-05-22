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
            // AWS Models (18 models)
            { name: "Claude 4.6 (Bedrock)", provider: "AWS Bedrock", providerClass: "aws", contextLength: "500K", inputPrice: 0.012, outputPrice: 0.06, currency: "USD", per: "1K tokens", featured: true, symbol: "BC46", docUrl: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-3.html" },
            { name: "Claude 4 Sonnet (Bedrock)", provider: "AWS Bedrock", providerClass: "aws", contextLength: "200K", inputPrice: 0.003, outputPrice: 0.015, currency: "USD", per: "1K tokens", symbol: "BC4S", docUrl: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-3.html" },
            { name: "Claude 3.7 Sonnet (Bedrock)", provider: "AWS Bedrock", providerClass: "aws", contextLength: "200K", inputPrice: 0.003, outputPrice: 0.015, currency: "USD", per: "1K tokens", symbol: "BC37", docUrl: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-3.html" },
            { name: "Claude 3.5 Sonnet (Bedrock)", provider: "AWS Bedrock", providerClass: "aws", contextLength: "200K", inputPrice: 0.003, outputPrice: 0.015, currency: "USD", per: "1K tokens", symbol: "BC35S", docUrl: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-3.html" },
            { name: "Claude 3.5 Haiku (Bedrock)", provider: "AWS Bedrock", providerClass: "aws", contextLength: "200K", inputPrice: 0.0008, outputPrice: 0.004, currency: "USD", per: "1K tokens", symbol: "BC35H", docUrl: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-3.html" },
            { name: "Claude 3 Opus (Bedrock)", provider: "AWS Bedrock", providerClass: "aws", contextLength: "200K", inputPrice: 0.015, outputPrice: 0.075, currency: "USD", per: "1K tokens", symbol: "BC3O", docUrl: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-3.html" },
            { name: "Amazon Nova Premier", provider: "AWS Bedrock", providerClass: "aws", contextLength: "1M", inputPrice: 0.0025, outputPrice: 0.0125, currency: "USD", per: "1K tokens", symbol: "ANPR", docUrl: "https://docs.aws.amazon.com/bedrock/latest/userguide/nova-models.html" },
            { name: "Amazon Nova Pro", provider: "AWS Bedrock", providerClass: "aws", contextLength: "300K", inputPrice: 0.0008, outputPrice: 0.0032, currency: "USD", per: "1K tokens", symbol: "ANP", docUrl: "https://docs.aws.amazon.com/bedrock/latest/userguide/nova-models.html" },
            { name: "Amazon Nova Lite", provider: "AWS Bedrock", providerClass: "aws", contextLength: "300K", inputPrice: 0.0002, outputPrice: 0.0008, currency: "USD", per: "1K tokens", symbol: "ANL", docUrl: "https://docs.aws.amazon.com/bedrock/latest/userguide/nova-models.html" },
            { name: "Amazon Nova Micro", provider: "AWS Bedrock", providerClass: "aws", contextLength: "128K", inputPrice: 0.000035, outputPrice: 0.00014, currency: "USD", per: "1K tokens", symbol: "ANM", docUrl: "https://docs.aws.amazon.com/bedrock/latest/userguide/nova-models.html" },
            { name: "Llama 3.3 70B (Bedrock)", provider: "AWS Bedrock", providerClass: "aws", contextLength: "128K", inputPrice: 0.00072, outputPrice: 0.00072, currency: "USD", per: "1K tokens", symbol: "L3370", docUrl: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-meta.html" },
            { name: "Llama 3.1 405B (Bedrock)", provider: "AWS Bedrock", providerClass: "aws", contextLength: "128K", inputPrice: 0.00532, outputPrice: 0.016, currency: "USD", per: "1K tokens", symbol: "L31405", docUrl: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-meta.html" },
            { name: "Llama 3.1 70B (Bedrock)", provider: "AWS Bedrock", providerClass: "aws", contextLength: "128K", inputPrice: 0.00099, outputPrice: 0.00099, currency: "USD", per: "1K tokens", symbol: "L3170", docUrl: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-meta.html" },
            { name: "Mistral Large 2 (Bedrock)", provider: "AWS Bedrock", providerClass: "aws", contextLength: "128K", inputPrice: 0.002, outputPrice: 0.006, currency: "USD", per: "1K tokens", symbol: "BML2", docUrl: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-mistral.html" },
            { name: "Titan Text G1 Express", provider: "AWS Bedrock", providerClass: "aws", contextLength: "8K", inputPrice: 0.0008, outputPrice: 0.0016, currency: "USD", per: "1K tokens", symbol: "TT1E", docUrl: "https://docs.aws.amazon.com/bedrock/latest/userguide/titan-text-models.html" },
            { name: "Cohere Command R+", provider: "AWS Bedrock", providerClass: "aws", contextLength: "128K", inputPrice: 0.003, outputPrice: 0.015, currency: "USD", per: "1K tokens", symbol: "BCCR+", docUrl: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-cohere-command.html" },
            { name: "Cohere Command R", provider: "AWS Bedrock", providerClass: "aws", contextLength: "128K", inputPrice: 0.0005, outputPrice: 0.0015, currency: "USD", per: "1K tokens", symbol: "BCCR", docUrl: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-cohere-command.html" },
            { name: "Stability AI SDXL 1.0", provider: "AWS Bedrock", providerClass: "aws", contextLength: "N/A", inputPrice: 0.04, outputPrice: 0.04, currency: "USD", per: "image", symbol: "SDXL", docUrl: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-stability-diffusion.html" },
            
            // Azure Models (10 models)
            { name: "GPT-5.3 (Azure)", provider: "Azure OpenAI", providerClass: "azure", contextLength: "256K", inputPrice: 0.015, outputPrice: 0.06, currency: "USD", per: "1K tokens", featured: true, symbol: "G53A", docUrl: "https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models" },
            { name: "GPT-4o (Azure)", provider: "Azure OpenAI", providerClass: "azure", contextLength: "128K", inputPrice: 0.0025, outputPrice: 0.01, currency: "USD", per: "1K tokens", symbol: "G4OA", docUrl: "https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models" },
            { name: "GPT-4o mini (Azure)", provider: "Azure OpenAI", providerClass: "azure", contextLength: "128K", inputPrice: 0.00015, outputPrice: 0.0006, currency: "USD", per: "1K tokens", symbol: "G4OMA", docUrl: "https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models" },
            { name: "o3 (Azure)", provider: "Azure OpenAI", providerClass: "azure", contextLength: "200K", inputPrice: 0.01, outputPrice: 0.04, currency: "USD", per: "1K tokens", symbol: "O3A", docUrl: "https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models" },
            { name: "o3 mini (Azure)", provider: "Azure OpenAI", providerClass: "azure", contextLength: "200K", inputPrice: 0.0011, outputPrice: 0.0044, currency: "USD", per: "1K tokens", symbol: "O3MA", docUrl: "https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models" },
            { name: "o4 mini (Azure)", provider: "Azure OpenAI", providerClass: "azure", contextLength: "200K", inputPrice: 0.0011, outputPrice: 0.0044, currency: "USD", per: "1K tokens", symbol: "O4MA", docUrl: "https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models" },
            { name: "GPT-4 Turbo (Azure)", provider: "Azure OpenAI", providerClass: "azure", contextLength: "128K", inputPrice: 0.01, outputPrice: 0.03, currency: "USD", per: "1K tokens", symbol: "G4TA", docUrl: "https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models" },
            { name: "DALL-E 3 (Azure)", provider: "Azure OpenAI", providerClass: "azure", contextLength: "N/A", inputPrice: 0.04, outputPrice: 0.04, currency: "USD", per: "image", symbol: "DE3A", docUrl: "https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models#dall-e-models" },
            { name: "Whisper (Azure)", provider: "Azure OpenAI", providerClass: "azure", contextLength: "N/A", inputPrice: 0.006, outputPrice: 0.006, currency: "USD", per: "minute", symbol: "WHA", docUrl: "https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models#whisper-models" },
            { name: "Text Embedding 3 Large (Azure)", provider: "Azure OpenAI", providerClass: "azure", contextLength: "8K", inputPrice: 0.00013, outputPrice: 0.00013, currency: "USD", per: "1K tokens", symbol: "TE3LA", docUrl: "https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models#embeddings-models" },
            
            // OpenAI Models (12 models)
            { name: "GPT-5.3", provider: "OpenAI", providerClass: "openai", contextLength: "256K", inputPrice: 0.015, outputPrice: 0.06, currency: "USD", per: "1K tokens", featured: true, symbol: "G53", docUrl: "https://platform.openai.com/docs/models" },
            { name: "GPT-5", provider: "OpenAI", providerClass: "openai", contextLength: "256K", inputPrice: 0.01, outputPrice: 0.04, currency: "USD", per: "1K tokens", featured: true, symbol: "G5", docUrl: "https://platform.openai.com/docs/models" },
            { name: "GPT-4o", provider: "OpenAI", providerClass: "openai", contextLength: "128K", inputPrice: 0.0025, outputPrice: 0.01, currency: "USD", per: "1K tokens", symbol: "G4O", docUrl: "https://platform.openai.com/docs/models/gpt-4o" },
            { name: "GPT-4o mini", provider: "OpenAI", providerClass: "openai", contextLength: "128K", inputPrice: 0.00015, outputPrice: 0.0006, currency: "USD", per: "1K tokens", symbol: "G4OM", docUrl: "https://platform.openai.com/docs/models/gpt-4o-mini" },
            { name: "o3", provider: "OpenAI", providerClass: "openai", contextLength: "200K", inputPrice: 0.01, outputPrice: 0.04, currency: "USD", per: "1K tokens", symbol: "O3", docUrl: "https://platform.openai.com/docs/models/o3" },
            { name: "o3 mini", provider: "OpenAI", providerClass: "openai", contextLength: "200K", inputPrice: 0.0011, outputPrice: 0.0044, currency: "USD", per: "1K tokens", symbol: "O3M", docUrl: "https://platform.openai.com/docs/models/o3-mini" },
            { name: "o4 mini", provider: "OpenAI", providerClass: "openai", contextLength: "200K", inputPrice: 0.0011, outputPrice: 0.0044, currency: "USD", per: "1K tokens", symbol: "O4M", docUrl: "https://platform.openai.com/docs/models/o4-mini" },
            { name: "GPT-4 Turbo", provider: "OpenAI", providerClass: "openai", contextLength: "128K", inputPrice: 0.01, outputPrice: 0.03, currency: "USD", per: "1K tokens", symbol: "G4T", docUrl: "https://platform.openai.com/docs/models/gpt-4-turbo" },
            { name: "DALL-E 3", provider: "OpenAI", providerClass: "openai", contextLength: "N/A", inputPrice: 0.04, outputPrice: 0.04, currency: "USD", per: "image", symbol: "DE3", docUrl: "https://platform.openai.com/docs/models/dall-e" },
            { name: "Whisper", provider: "OpenAI", providerClass: "openai", contextLength: "N/A", inputPrice: 0.006, outputPrice: 0.006, currency: "USD", per: "minute", symbol: "WH", docUrl: "https://platform.openai.com/docs/models/whisper" },
            { name: "Text Embedding 3 Large", provider: "OpenAI", providerClass: "openai", contextLength: "8K", inputPrice: 0.00013, outputPrice: 0.00013, currency: "USD", per: "1K tokens", symbol: "TE3L", docUrl: "https://platform.openai.com/docs/models/embeddings" },
            { name: "Text Embedding 3 Small", provider: "OpenAI", providerClass: "openai", contextLength: "8K", inputPrice: 0.00002, outputPrice: 0.00002, currency: "USD", per: "1K tokens", symbol: "TE3S", docUrl: "https://platform.openai.com/docs/models/embeddings" },

            // Anthropic Models (9 models)
            { name: "Claude 4.6", provider: "Anthropic", providerClass: "anthropic", contextLength: "500K", inputPrice: 0.012, outputPrice: 0.06, currency: "USD", per: "1K tokens", featured: true, symbol: "C46", docUrl: "https://docs.anthropic.com/en/docs/about-claude/models" },
            { name: "Claude 4.5", provider: "Anthropic", providerClass: "anthropic", contextLength: "500K", inputPrice: 0.008, outputPrice: 0.04, currency: "USD", per: "1K tokens", symbol: "C45", docUrl: "https://docs.anthropic.com/en/docs/about-claude/models" },
            { name: "Claude 4 Sonnet", provider: "Anthropic", providerClass: "anthropic", contextLength: "200K", inputPrice: 0.003, outputPrice: 0.015, currency: "USD", per: "1K tokens", symbol: "C4S", docUrl: "https://docs.anthropic.com/en/docs/about-claude/models" },
            { name: "Claude 4 Haiku", provider: "Anthropic", providerClass: "anthropic", contextLength: "200K", inputPrice: 0.0008, outputPrice: 0.004, currency: "USD", per: "1K tokens", symbol: "C4H", docUrl: "https://docs.anthropic.com/en/docs/about-claude/models" },
            { name: "Claude 3.7 Sonnet", provider: "Anthropic", providerClass: "anthropic", contextLength: "200K", inputPrice: 0.003, outputPrice: 0.015, currency: "USD", per: "1K tokens", symbol: "C37S", docUrl: "https://docs.anthropic.com/en/docs/about-claude/models" },
            { name: "Claude 3.5 Sonnet", provider: "Anthropic", providerClass: "anthropic", contextLength: "200K", inputPrice: 0.003, outputPrice: 0.015, currency: "USD", per: "1K tokens", symbol: "C35S", docUrl: "https://docs.anthropic.com/en/docs/about-claude/models" },
            { name: "Claude 3.5 Haiku", provider: "Anthropic", providerClass: "anthropic", contextLength: "200K", inputPrice: 0.0008, outputPrice: 0.004, currency: "USD", per: "1K tokens", symbol: "C35H", docUrl: "https://docs.anthropic.com/en/docs/about-claude/models" },
            { name: "Claude 3 Opus", provider: "Anthropic", providerClass: "anthropic", contextLength: "200K", inputPrice: 0.015, outputPrice: 0.075, currency: "USD", per: "1K tokens", symbol: "C3O", docUrl: "https://docs.anthropic.com/en/docs/about-claude/models" },
            { name: "Claude 3 Haiku", provider: "Anthropic", providerClass: "anthropic", contextLength: "200K", inputPrice: 0.00025, outputPrice: 0.00125, currency: "USD", per: "1K tokens", symbol: "C3H", docUrl: "https://docs.anthropic.com/en/docs/about-claude/models" },
            
            // Mistral Models (8 models)
            { name: "Mistral Large 2", provider: "Mistral AI", providerClass: "mistral", contextLength: "128K", inputPrice: 0.002, outputPrice: 0.006, currency: "USD", per: "1K tokens", featured: true, symbol: "ML2", docUrl: "https://docs.mistral.ai/getting-started/models/" },
            { name: "Mistral Medium 3", provider: "Mistral AI", providerClass: "mistral", contextLength: "128K", inputPrice: 0.0004, outputPrice: 0.002, currency: "USD", per: "1K tokens", symbol: "MM3", docUrl: "https://docs.mistral.ai/getting-started/models/" },
            { name: "Mistral Small 3.2", provider: "Mistral AI", providerClass: "mistral", contextLength: "128K", inputPrice: 0.0001, outputPrice: 0.0003, currency: "USD", per: "1K tokens", symbol: "MS32", docUrl: "https://docs.mistral.ai/getting-started/models/" },
            { name: "Mistral Nemo", provider: "Mistral AI", providerClass: "mistral", contextLength: "128K", inputPrice: 0.00015, outputPrice: 0.00015, currency: "USD", per: "1K tokens", symbol: "MN", docUrl: "https://docs.mistral.ai/getting-started/models/" },
            { name: "Codestral 2501", provider: "Mistral AI", providerClass: "mistral", contextLength: "256K", inputPrice: 0.003, outputPrice: 0.009, currency: "USD", per: "1K tokens", symbol: "CS25", docUrl: "https://docs.mistral.ai/getting-started/models/" },
            { name: "Mistral Embed", provider: "Mistral AI", providerClass: "mistral", contextLength: "8K", inputPrice: 0.0001, outputPrice: 0.0001, currency: "USD", per: "1K tokens", symbol: "ME", docUrl: "https://docs.mistral.ai/getting-started/models/" },
            { name: "Pixtral Large", provider: "Mistral AI", providerClass: "mistral", contextLength: "128K", inputPrice: 0.002, outputPrice: 0.006, currency: "USD", per: "1K tokens", symbol: "PXL", docUrl: "https://docs.mistral.ai/getting-started/models/" },
            { name: "Pixtral 12B", provider: "Mistral AI", providerClass: "mistral", contextLength: "128K", inputPrice: 0.00015, outputPrice: 0.00015, currency: "USD", per: "1K tokens", symbol: "PX12", docUrl: "https://docs.mistral.ai/getting-started/models/" },
            
            // GCP Models (16 models)
            { name: "Gemini 2.5 Pro", provider: "Google Cloud", providerClass: "gcp", contextLength: "1M", inputPrice: 0.00125, outputPrice: 0.01, currency: "USD", per: "1K tokens", featured: true, symbol: "G25P", docUrl: "https://cloud.google.com/vertex-ai/generative-ai/docs/models" },
            { name: "Gemini 2.5 Flash", provider: "Google Cloud", providerClass: "gcp", contextLength: "1M", inputPrice: 0.00015, outputPrice: 0.0006, currency: "USD", per: "1K tokens", symbol: "G25F", docUrl: "https://cloud.google.com/vertex-ai/generative-ai/docs/models" },
            { name: "Gemini 2.0 Flash", provider: "Google Cloud", providerClass: "gcp", contextLength: "1M", inputPrice: 0.0001, outputPrice: 0.0004, currency: "USD", per: "1K tokens", symbol: "G20F", docUrl: "https://cloud.google.com/vertex-ai/generative-ai/docs/models" },
            { name: "Gemini 2.0 Flash Lite", provider: "Google Cloud", providerClass: "gcp", contextLength: "1M", inputPrice: 0.000075, outputPrice: 0.0003, currency: "USD", per: "1K tokens", symbol: "G20FL", docUrl: "https://cloud.google.com/vertex-ai/generative-ai/docs/models" },
            { name: "Gemini 1.5 Pro", provider: "Google Cloud", providerClass: "gcp", contextLength: "2M", inputPrice: 0.00125, outputPrice: 0.00375, currency: "USD", per: "1K tokens", symbol: "G15P", docUrl: "https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini" },
            { name: "Gemini 1.5 Flash", provider: "Google Cloud", providerClass: "gcp", contextLength: "1M", inputPrice: 0.000075, outputPrice: 0.0003, currency: "USD", per: "1K tokens", symbol: "G15F", docUrl: "https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini" },
            { name: "Claude 4.6 (Vertex AI)", provider: "Google Cloud", providerClass: "gcp", contextLength: "500K", inputPrice: 0.012, outputPrice: 0.06, currency: "USD", per: "1K tokens", symbol: "VC46", docUrl: "https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/use-claude" },
            { name: "Claude 4 Sonnet (Vertex AI)", provider: "Google Cloud", providerClass: "gcp", contextLength: "200K", inputPrice: 0.003, outputPrice: 0.015, currency: "USD", per: "1K tokens", symbol: "VC4S", docUrl: "https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/use-claude" },
            { name: "Claude 3.7 Sonnet (Vertex AI)", provider: "Google Cloud", providerClass: "gcp", contextLength: "200K", inputPrice: 0.003, outputPrice: 0.015, currency: "USD", per: "1K tokens", symbol: "VC37", docUrl: "https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/use-claude" },
            { name: "Claude 3.5 Sonnet (Vertex AI)", provider: "Google Cloud", providerClass: "gcp", contextLength: "200K", inputPrice: 0.003, outputPrice: 0.015, currency: "USD", per: "1K tokens", symbol: "VC35S", docUrl: "https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/claude" },
            { name: "Claude 3.5 Haiku (Vertex AI)", provider: "Google Cloud", providerClass: "gcp", contextLength: "200K", inputPrice: 0.0008, outputPrice: 0.004, currency: "USD", per: "1K tokens", symbol: "VC35H", docUrl: "https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/use-claude" },
            { name: "Llama 3.1 405B (Vertex AI)", provider: "Google Cloud", providerClass: "gcp", contextLength: "128K", inputPrice: 0.005, outputPrice: 0.016, currency: "USD", per: "1K tokens", symbol: "VL405", docUrl: "https://cloud.google.com/vertex-ai/generative-ai/docs/open-models/use-llama" },
            { name: "Cohere Command R+", provider: "Google Cloud", providerClass: "gcp", contextLength: "128K", inputPrice: 0.0025, outputPrice: 0.01, currency: "USD", per: "1K tokens", symbol: "CCR+", docUrl: "https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/cohere" },
            { name: "Cohere Command R", provider: "Google Cloud", providerClass: "gcp", contextLength: "128K", inputPrice: 0.0005, outputPrice: 0.0015, currency: "USD", per: "1K tokens", symbol: "CCR", docUrl: "https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/cohere" },
            { name: "Imagen 3", provider: "Google Cloud", providerClass: "gcp", contextLength: "N/A", inputPrice: 0.04, outputPrice: 0.04, currency: "USD", per: "image", symbol: "IMG3", docUrl: "https://cloud.google.com/vertex-ai/generative-ai/docs/image/overview" },
            { name: "Text Embedding 004", provider: "Google Cloud", providerClass: "gcp", contextLength: "2K", inputPrice: 0.00001, outputPrice: 0.00001, currency: "USD", per: "1K tokens", symbol: "TE4", docUrl: "https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings/get-text-embeddings" },
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
            Math.round(Object.values(this.inputTokens).reduce((a, b) => a + b, 0) / 5) : 
            this.inputTokens[provider];
        const reportOutputTokens = provider === 'all' ? 
            Math.round(Object.values(this.outputTokens).reduce((a, b) => a + b, 0) / 5) : 
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
        const now = new Date();
        const dateTime = now.toLocaleString();
        const element = document.getElementById('calc-last-updated');
        if (element) {
            element.textContent = dateTime;
        }
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