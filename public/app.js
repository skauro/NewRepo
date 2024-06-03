document.addEventListener('DOMContentLoaded', () => {
    const feedsContainer = document.getElementById('feeds-container');
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modal-body');
    const closeModalButton = document.getElementsByClassName('close-button')[0];

    async function loadFeed() {
        try {
            const response = await fetch('/proxy?url=https://flipboard.com/@raimoseero/feed-nii8kd0sz.rss');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(data, "application/xml");
            displayArticles(xml);
        } catch (error) {
            console.error('Error fetching feed:', error);
        }
    }

    loadFeed();

    function displayArticles(xml) {
        const items = xml.querySelectorAll('item');
        items.forEach(item => {
            const title = item.querySelector('title').textContent;
            const link = item.querySelector('link').textContent;
            const description = item.querySelector('description').textContent;
            const pubDate = item.querySelector('pubDate').textContent;
            const categories = Array.from(item.querySelectorAll('category')).map(cat => cat.textContent).join(', ');
            const mediaContent = item.querySelector('content');
            const mediaUrl = mediaContent ? mediaContent.getAttribute('url') : ''; // Extract URL attribute
           

            const articleElement = document.createElement('div');
            articleElement.classList.add('feed');
            
            articleElement.innerHTML = `
                <h2>${title}</h2>
                <p><img src="${mediaUrl}" alt="Image" width="550px" height="300px"></p>
                <p>${description}</p>
                <p><strong>Published:</strong> ${pubDate}</p>
                <p><strong>Categories:</strong> ${categories}</p>
                <a href="${link}" target="_blank">Read more</a>
                

            `;

            articleElement.addEventListener('click', () => {
                fetchArticleContent(link);
            });

            feedsContainer.appendChild(articleElement);
        });
    }

    function fetchArticleContent(url) {
        fetch('https://uptime-mercury-api.azurewebsites.net/webparser', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        })
            .then(response => response.json())
            .then(data => {
                displayArticleContent(data);
            })
            .catch(error => console.error('Error fetching article content:', error));
    }

    function displayArticleContent(data) {
        modalContent.innerHTML = data.content;
        modal.style.display = 'block';
    }

    closeModalButton.onclick = function () {
        modal.style.display = 'none';
    };

    window.onclick = function (event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
});
