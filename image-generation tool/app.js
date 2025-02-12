const GOOGLE_API_KEY = 'AIzaSyChffe7WOOxg6VLoYgHquncO7EdxhHJggs';
const SEARCH_ENGINE_ID = '01175995948fa41ee';

class SpeechRecognitionApp {
  constructor() {
    this.isListening = false;
    this.recognition = null;
    this.retryTimeout = null;
    this.retryCount = 0;
    
    // DOM elements
    this.toggleButton = document.getElementById('toggleButton');
    this.buttonText = document.getElementById('buttonText');
    this.micIcon = document.getElementById('micIcon');
    this.transcriptBox = document.getElementById('transcriptBox');
    this.imageGallery = document.getElementById('imageGallery');
    this.errorElement = document.getElementById('error');
    this.loader = document.getElementById('loader');
    this.clearTranscriptsButton = document.getElementById('clearTranscripts');
    this.clearImagesButton = document.getElementById('clearImages');
    
    this.initializeEventListeners();
    this.initializeRecognition();
  }

  initializeEventListeners() {
    this.toggleButton.addEventListener('click', () => {
      if (this.isListening) {
        this.stopListening();
      } else {
        this.startListening();
      }
    });

    this.clearTranscriptsButton.addEventListener('click', () => {
      this.transcriptBox.innerHTML = '';
    });

    this.clearImagesButton.addEventListener('click', () => {
      this.imageGallery.innerHTML = '';
    });
  }

  async checkBrowserPermissions() {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' });
      if (result.state === 'denied') {
        this.showError('Microphone access is denied. Please allow microphone access in your browser settings and refresh the page.');
        return false;
      }
      return true;
    } catch (err) {
      console.log('Permission check error:', err);
      return true;
    }
  }

  initializeRecognition() {
    if (!('webkitSpeechRecognition' in window)) {
      this.showError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Brave.');
      return;
    }

    this.recognition = new webkitSpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      this.errorElement.textContent = '';
      this.retryCount = 0;
      this.updateUI();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.updateUI();
      
      if (this.isListening && this.retryCount < 3) {
        this.retryCount++;
        this.retryTimeout = setTimeout(() => {
          try {
            this.recognition.start();
          } catch (err) {
            console.log('Failed to restart recognition:', err);
          }
        }, 1000);
      }
    };

    this.recognition.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1];
      if (lastResult.isFinal) {
        const transcript = lastResult[0].transcript;
        this.addTranscript(transcript);
        this.extractKeywordsAndFetchImages(transcript);
      }
    };

    this.recognition.onerror = (event) => {
      console.log('Speech recognition error:', event.error);
      this.handleError(event);
    };
  }

  handleError(event) {
    if (event.error === 'network') {
      this.showError(
        'Network error occurred. Please try these steps:\n' +
        '1. Check your internet connection\n' +
        '2. In Brave shield settings (lion icon):\n' +
        '   - Set "Prevent sites from fingerprinting me" to "Standard"\n' +
        '   - Disable "Shields" completely for this site\n' +
        '3. Allow microphone access in site settings\n' +
        '4. Clear browser cache and cookies\n' +
        '5. Refresh the page\n\n' +
        'If the issue persists, try using Chrome or Edge browser.'
      );
      setTimeout(() => this.initializeRecognition(), 3000);
    } else if (event.error === 'not-allowed') {
      this.showError('Microphone access was denied. Please allow microphone access in your browser settings and refresh the page.');
      this.isListening = false;
    } else if (event.error === 'audio-capture') {
      this.showError('No microphone was found. Please ensure your microphone is properly connected and try again.');
      this.isListening = false;
    } else {
      this.showError(`Speech recognition error: ${event.error}. Please refresh the page and try again.`);
      this.isListening = false;
    }
    this.updateUI();
  }

  async startListening() {
    const hasPermission = await this.checkBrowserPermissions();
    if (!hasPermission) return;

    try {
      this.recognition.start();
    } catch (err) {
      console.log('Recognition already started');
      this.initializeRecognition();
      setTimeout(() => {
        this.recognition?.start();
      }, 100);
    }
  }

  stopListening() {
    if (this.recognition) {
      this.recognition.stop();
      this.isListening = false;
    }
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    this.retryCount = 0;
    this.updateUI();
  }

  updateUI() {
    this.toggleButton.classList.toggle('listening', this.isListening);
    this.buttonText.textContent = this.isListening ? 'Stop Listening' : 'Start Listening';
    
    // Update microphone icon
    if (this.isListening) {
      this.micIcon.innerHTML = '<path d="m12 1 9.5 5.5v11L12 23l-9.5-5.5v-11L12 1Z"></path><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path>';
    } else {
      this.micIcon.innerHTML = '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line>';
    }
  }

  addTranscript(text) {
    const transcriptElement = document.createElement('div');
    transcriptElement.className = 'transcript';
    
    const timeElement = document.createElement('span');
    timeElement.className = 'transcript-time';
    timeElement.textContent = new Date().toLocaleTimeString();
    
    const textElement = document.createElement('p');
    textElement.textContent = text;
    
    transcriptElement.appendChild(timeElement);
    transcriptElement.appendChild(textElement);
    this.transcriptBox.appendChild(transcriptElement);
    this.transcriptBox.scrollTop = this.transcriptBox.scrollHeight;
  }

  extractKeywords(text) {
    // Define common name prefixes and titles to help identify proper names
    const titles = ['mr', 'mrs', 'ms', 'dr', 'prof'];
    const words = text.toLowerCase().trim().split(/\s+/);
    const phrases = [];
    let i = 0;

    while (i < words.length) {
      // Check for title + name combinations
      if (i < words.length - 1 && titles.includes(words[i].replace('.', ''))) {
        phrases.push(words[i] + ' ' + words[i + 1]);
        i += 2;
        continue;
      }

      // Check for potential proper names (two capitalized words in the original text)
      if (i < words.length - 1) {
        const originalWords = text.split(/\s+/);
        const currentWord = originalWords[i];
        const nextWord = originalWords[i + 1];
        if (
          currentWord && nextWord &&
          currentWord[0] === currentWord[0].toUpperCase() &&
          nextWord[0] === nextWord[0].toUpperCase()
        ) {
          phrases.push(words[i] + ' ' + words[i + 1]);
          i += 2;
          continue;
        }
      }

      // Add single words that aren't stop words
      const stopWords = new Set(['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me']);
      if (!stopWords.has(words[i]) && words[i].length > 2) {
        phrases.push(words[i]);
      }
      i++;
    }

    // Return unique phrases, prioritizing multi-word phrases
    return [...new Set(phrases)]
      .sort((a, b) => b.split(' ').length - a.split(' ').length)
      .slice(0, 3);
  }

  async fetchImages(keyword) {
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(keyword)}&searchType=image&num=1&safe=active`;
    
    try {
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Google API Error:', data);
        throw new Error(data.error?.message || 'Failed to fetch images');
      }
      
      if (data.items && data.items.length > 0) {
        return {
          url: data.items[0].link,
          title: data.items[0].title || keyword,
          keyword
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching images:', error);
      this.showError(error.message);
      return null;
    }
  }

  async extractKeywordsAndFetchImages(text) {
    const keywords = this.extractKeywords(text);
    if (keywords.length === 0) return;

    this.loader.classList.remove('hidden');
    
    try {
      const imagePromises = keywords.map(keyword => this.fetchImages(keyword));
      const images = await Promise.all(imagePromises);
      const validImages = images.filter(img => img !== null);
      
      this.updateImageGallery(validImages);
    } finally {
      this.loader.classList.add('hidden');
    }
  }

  updateImageGallery(newImages) {
    const currentImages = this.imageGallery.children.length;
    const maxImages = 6;
    
    // Remove oldest images if we're going to exceed the maximum
    while (currentImages + newImages.length > maxImages) {
      this.imageGallery.removeChild(this.imageGallery.firstChild);
    }
    
    newImages.forEach(image => {
      const container = document.createElement('div');
      container.className = 'image-container';
      
      const img = document.createElement('img');
      img.src = image.url;
      img.alt = image.title;
      img.loading = 'lazy';
      
      const label = document.createElement('div');
      label.className = 'image-label';
      label.textContent = image.keyword;
      
      container.appendChild(img);
      container.appendChild(label);
      this.imageGallery.appendChild(container);
    });
  }

  showError(message) {
    this.errorElement.textContent = message;
  }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SpeechRecognitionApp();
});