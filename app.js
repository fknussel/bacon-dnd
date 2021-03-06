const Bacon = window.Bacon;

const pointerDownStream = Bacon.fromEvent(window, 'pointerdown');
const pointerMoveStream = Bacon.fromEvent(window, 'pointermove');
const pointerUpStream = Bacon.fromEvent(window, 'pointerup');

pointerDownStream
  .filter(onlyPointerDownsOnCards)
  .flatMap(cardOffsetStream)
  .onValue(updateBoard);

function onlyPointerDownsOnCards(pointerDownEvent) {
  return pointerDownEvent.target.matches('.board__card');
}

function cardOffsetStream(pointerDownEvent) {
  const cardId = pointerDownEvent.target.dataset.id;

  return pointerMoveStream
    .takeUntil(pointerUpStream)
    .merge(pointerUpStream.first())
    .map(pointerEvent => ({
      cardId,
      offsetX: pointerEvent.clientX - pointerDownEvent.clientX,
      offsetY: pointerEvent.clientY - pointerDownEvent.clientY,
      containingColumn: getContainingColumn(pointerEvent),
      isPointerUp: pointerEvent.type === 'pointerup'
    }));
}

function updateBoard(data) {
  const cards = Array.from(document.querySelectorAll('.board__card'));
  const activeCard = cards.find(cardElement => cardElement.dataset.id === data.cardId);

  if (!activeCard) {
    return;
  }

  if (data.isPointerUp) {
    releaseCard(activeCard, data.containingColumn);
    return;
  }

  moveCard(activeCard, data.containingColumn, data.offsetX, data.offsetY);
}

function moveCard(card, column, offsetX, offsetY) {
  card.classList.add('board__card--moving');
  card.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

  if (column) {
    card.classList.add('board__card--active');
  } else {
    card.classList.remove('board__card--active');
  }
}

function releaseCard(card, column) {
  card.classList.remove('board__card--moving', 'board__card--active');
  card.style.transform = 'translate(0px, 0px)';

  if (column) {
    column.querySelector('.board__inner-column').appendChild(card);
  }
}

function getContainingColumn(pointerMoveEvent) {
  const columns = Array.from(document.querySelectorAll('.board__column'));

  for (let i = 0; i < columns.length; i++) {
    const column = columns[i];
    const columnRect = column.getBoundingClientRect();
    const isContained =
      pointerMoveEvent.clientX >= columnRect.left &&
      pointerMoveEvent.clientX <= columnRect.left + columnRect.width;

    if (isContained) {
      return column;
    }
  }

  return null;
}
