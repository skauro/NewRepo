document.addEventListener('DOMContentLoaded', () => {
    const feedForm = document.getElementById('feed-form');
    const feedUrlInput = document.getElementById('feed-url');
    const articlesContainer = document.getElementById('articles');
    const categoryFilter = document.getElementById('category-filter');
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    const closeModalButton = document.querySelector('.close-button');

    let feeds = JSON.parse(localStorage.getItem('feeds')) || [];

    const fetchRSSFeed = async (url) => {
        const response = await fetch(url);
        const text = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'application/xml');
        const items = xml.querySelectorAll('item');
        const articles = [];
        items.forEach(item => {
            const title = item.querySelector('title').textContent;
            const link = item.querySelector('link').textContent;
            const description = item.querySelector('description').textContent;
            const pubDate = new Date(item.querySelector('pubDate').textContent);
            const category = item.querySelector('category') ? item.querySelector('category').textContent : 'Uncategorized';
            const enclosure = item.querySelector('enclosure') ? item.querySelector('enclosure').getAttribute('url') : '';
            articles.push({ title, link, description, pubDate, category, enclosure });
        });
        return articles;
    };

    const renderArticles = (articles) => {
        articlesContainer.innerHTML = '';
        articles.sort((a, b) => b.pubDate - a.pubDate);
        articles.forEach(article => {
            const articleElement = document.createElement('div');
            articleElement.classList.add('article');
            articleElement.innerHTML = `
                <h2>${article.title}</h2>
                <p>${article.description}</p>
                <img src="${article.enclosure}" alt="${article.title}">
                <button class="read-more" data-url="${article.link}">Read more</button>
            `;
            articlesContainer.appendChild(articleElement);
        });

        document.querySelectorAll('.read-more').forEach(button => {
            button.addEventListener('click', async (e) => {
                const url = e.target.dataset.url;
                const response = await fetch('https://uptime-mercury-api.azurewebsites.net/webparser', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ url })
                });
                const data = await response.json();
                modalBody.innerHTML = data.content;
                modal.style.display = 'flex';
            });
        });
    };

    const loadFeeds = async () => {
        let allArticles = [];
        for (let feed of feeds) {
            const articles = await fetchRSSFeed(feed);
            allArticles = [...allArticles, ...articles];
        }
        renderArticles(allArticles);
    };

    const updateCategoryFilter = () => {
        const categories = new Set();
        document.querySelectorAll('.article').forEach(article => {
            const category = article.dataset.category;
            categories.add(category);
        });
        categoryFilter.innerHTML = '<option value="all">All</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    };

    feedForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const feedUrl = feedUrlInput.value;
        feeds.push(feedUrl);
        localStorage.setItem('feeds', JSON.stringify(feeds));
        feedUrlInput.value = '';
        loadFeeds();
    });

    categoryFilter.addEventListener('change', (e) => {
        const category = e.target.value;
        const articles = document.querySelectorAll('.article');
        articles.forEach(article => {
            if (category === 'all' || article.dataset.category === category) {
                article.style.display = 'block';
            } else {
                article.style.display = 'none';
            }
        });
    });

    closeModalButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    loadFeeds();
});
