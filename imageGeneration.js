

this.imageGallery = document.getElementById('imageGallery');

const handler = {

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
      },
    
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
      },
    
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
};

module.exports = handler;
