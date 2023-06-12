import Notiflix from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import { getData } from './pixabay';

const refs = {
  search: document.querySelector('.search-form'),
  gallery: document.querySelector('.gallery'),
  loadMoreBtn: document.querySelector('.load-more'),
  target: document.querySelector('.js-guard'),
};

let query = '';
let currentPage = 1;
const perPage = 40;

refs.loadMoreBtn.classList.add('is-hidden');

// Відображення великої версії зображення
let lightbox = new SimpleLightbox('.photo-card a', {
  captionDelay: 250,
});

// Нескінченне завантаження зображень під час прокручування сторінки
const options = {
  root: null,
  rootMargin: '200px',
  threshold: 1.0,
};

let observer = new IntersectionObserver(onLoad, options);
function onLoad(entries, observer) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      currentPage += 1;
      lightbox.refresh();
      showPhotos(query, currentPage);
    }
  });
}

// Виконання пошуку і відтворення зображень по сабміту
refs.search.addEventListener('submit', onSearchBtn);

function onSearchBtn(event) {
  event.preventDefault();
  currentPage = 1;

  observer.unobserve(refs.target);

  const searchValue = event.currentTarget.elements.searchQuery.value.trim();

  if (!searchValue) {
    Notiflix.Notify.failure(
      'Sorry, there are no images matching your search query. Please try again.'
    );
    return;
  } else if (searchValue === query) {
    return;
  }
  refs.gallery.innerHTML = '';
  query = searchValue;
  lightbox.refresh();
  showPhotos(query, currentPage);

  return query;
}

// Відправка запиту та рендерінг галереї
async function showPhotos(query, currentPage = 1) {
  const { hits, totalHits } = await getData(query, currentPage);
  const totalPages = Math.ceil(totalHits / perPage);

  refs.gallery.insertAdjacentHTML('beforeend', createMarkupCards({ hits }));

  if (currentPage === totalPages) {
    observer.unobserve(refs.target);

    Notiflix.Notify.info(
      "We're sorry, but you've reached the end of search results."
    );
  } else {
    observer.observe(refs.target);
  }

  // Перевірка чи відповідь з сервера не порожня
  if (hits.length === 0) {
    Notiflix.Notify.failure(
      'Sorry, there are no images matching your search query. Please try again.'
    );
  } else if (currentPage === 1) {
    Notiflix.Notify.success(`Hooray! We found ${totalHits} images.`);
  }
  lightbox.refresh();
}

// Створення розмітки групи зображень
function createMarkupCards({ hits }) {
  return hits
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => `<div class="photo-card">
            <a href="${largeImageURL}">
            <img src="${webformatURL}" alt="${tags}" loading="lazy" />
            </a>
            <div class="info">
                <p class="info-item">
                <b>Likes</b>
                ${likes}
                </p>
                <p class="info-item">
                <b>Views</b>
                ${views}
                </p>
                <p class="info-item">
                <b>Comments</b>
                ${comments}
                </p>
                <p class="info-item">
                <b>Downloads</b>
                ${downloads}
                </p>
            </div>
            </div>`
    )
    .join('');
}
