/** The visible detail and its credit always come from the same museum record. */
export function openPaintingGallery() {
  const works = JSON.parse(document.getElementById('room-paintings').textContent).works;
  if (!works?.length) return;
  const base = new URL(document.querySelector('meta[name="poetry-gallery-base"]').content, document.baseURI);
  const windowPicture = document.querySelector('.window-painting');
  const wall = document.querySelector('.wall-painting');
  const caption = document.getElementById('painting-caption');
  const button = document.getElementById('next-painting');
  const credits = document.getElementById('painting-sources');
  const key = 'poetry-i-like:painting';
  let saved;
  try { saved = localStorage.getItem(key); } catch {}
  let selected = Math.max(0, works.findIndex(work => work.id === saved));
  let requested = selected;
  let revision = 0;

  function asset(file) {
    const filename = file.split('/').pop();
    if (!/^[a-z0-9-]+\.webp$/.test(filename)) throw Error('Missing painting asset');
    return new URL(filename, base).href;
  }

  function museumLink(url, title) {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = title;
    return link;
  }

  for (const work of works) {
    const item = document.createElement('li');
    item.append(museumLink(work.url, work.title), ' · ' + work.artist + ', ' + work.date + '. ' +
      work.medium + '. ' + work.museum + '. ' + work.creditLine + '. ', museumLink(work.rightsUrl, work.rights));
    credits.append(item);
  }
  document.getElementById('painting-credits').hidden = false;

  async function showPainting(index) {
    const request = ++revision;
    const work = works[index];
    const mobile = asset(work.mobileImage), wide = asset(work.image);
    const probe = new Image();
    probe.src = matchMedia('(max-width:700px)').matches ? mobile : wide;
    try { await probe.decode(); } catch {
      if (request===revision) requested=selected;
      return;
    }
    if (request !== revision) return;
    selected = index;
    for (const picture of [windowPicture, wall]) {
      const image = picture.querySelector('img');
      picture.querySelector('source').srcset = mobile;
      image.src = wide;
      image.style.objectPosition = work.position;
      picture.hidden = false;
    }
    windowPicture.querySelector('img').alt = work.alt;
    document.getElementById('painting-window').dataset.artwork = work.id;
    document.getElementById('painting-record').href = work.url;
    document.getElementById('painting-title').textContent = work.title;
    document.getElementById('painting-byline').textContent = work.artist + ', ' + work.date;
    caption.hidden = false;
    button.hidden = works.length < 2;
    try { localStorage.setItem(key, work.id); } catch {}
  }
  button.addEventListener('click', () => {
    requested=(requested+1)%works.length;
    void showPainting(requested);
  });
  void showPainting(selected);
}
