var canvasGrid = document.getElementById("canvas-grid");
var canvasCells = document.getElementById("canvas-cells");
var canvasContainer = document.getElementById("canvas-container");
var ctxGrid = canvasGrid.getContext("2d");
var ctxCells = canvasCells.getContext("2d");

var isRunning = false;

var timer;
var generation = 0;
var genTime = 0;
var sumTime = 0;
var numberOfCells = 50;
var size;
var cellSize = 1.0;

//Список живых клеток
var storage = [];
//Карта живых клеток
var cellMap = [];

//Сдвиги индектов для каждого из 8 соседей
const neighborOffset = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

//Вычисление индексов клеток с противоположной стороны границы поля
boundIndex = (x) =>
  x - (x >= numberOfCells ? numberOfCells : x < 0 ? -numberOfCells : 0);

//Задает стандартные размеры игрового поля
function resetCanvasSize() {
  canvasContainer.style.width = canvasContainer.style.height =
    10 * Math.round(0.097 * window.innerHeight) + "px";
  size =
    ctxGrid.canvas.width =
    ctxGrid.canvas.height =
    ctxCells.canvas.width =
    ctxCells.canvas.height =
      10 * Math.round(0.097 * window.innerHeight);
}

//Применение новой размерности игрового поля
function applyNewSize() {
  resetCanvasSize();
  drawGrid();
  drawCells();
}

//Вычисляет и корректирует размеры всего поля и одной клетки
function setupGrid() {
  ctxGrid.beginPath();

  if (isRunning) return;

  numberOfCells = document.getElementById("size").value =
    5 * Math.round(document.getElementById("size").value / 5);
  cellSize = size / numberOfCells;
  if (cellSize < 4.0) {
    cellSize = 4.0;
    canvasContainer.style.width = canvasContainer.style.height =
      cellSize * numberOfCells + "px";
    size =
      ctxGrid.canvas.width =
      ctxGrid.canvas.height =
      ctxCells.canvas.width =
      ctxCells.canvas.height =
        cellSize * numberOfCells;
  }
}

//Отрисовка сетки игрового поля
function drawGrid() {
  setupGrid();

  for (let c = cellSize; c < size; c += cellSize) {
    ctxGrid.moveTo(c, 0);
    ctxGrid.lineTo(c, size);

    ctxGrid.moveTo(0, c);
    ctxGrid.lineTo(size, c);
  }
  ctxGrid.strokeStyle = "#ddd";
  ctxGrid.stroke();
}

//Отрисовка живых клеток
function drawCells() {
  ctxCells.clearRect(0, 0, size, size);
  const rectSize = cellSize - 1;
  for (const [x, y] of storage)
    ctxCells.fillRect(x * cellSize + 1, y * cellSize + 1, rectSize, rectSize);
  document.getElementById("alive").innerHTML = storage.length;
}

//Подготовка и запуск расчётов
function runLife() {
  cutStorage();
  isRunning = true;
  document.getElementById("apply").disabled = true;
  document.getElementById("start").disabled = true;
  document.getElementById("stop").disabled = false;
  document.getElementById("clear").disabled = true;
  runGeneration();
}

//Пауза игры
function stopLife() {
  isRunning = false;
  document.getElementById("apply").disabled = false;
  document.getElementById("start").disabled = false;
  document.getElementById("stop").disabled = true;
  document.getElementById("clear").disabled = false;
}

//Сброс данных игры
function clearLife() {
  storage = [];
  document.getElementById("alive").innerHTML = 0;
  document.getElementById("clear").disabled = true;
  genTime = 0;
  sumTime = 0;
  generation = 0;
  document.getElementById("genTime").innerHTML = "0 мс";
  document.getElementById("sumTime").innerHTML = "0 мс";
  document.getElementById("generation").innerHTML = 0;
  drawCells();
}

//Проверяет живая клетка или нет
function isCellAlive([i, j]) {
  let neighborsCount = 0;

  for (const [_x, _y] of neighborOffset) {
    neighborsCount += isInCellMap(boundIndex(i + _x), boundIndex(j + _y))
      ? 1
      : 0;
    if (neighborsCount > 3) return false;
  }

  if (neighborsCount == 3 || (neighborsCount == 2 && isInCellMap(i, j)))
    return true;
  return false;
}

//Получение списка живых соседей
function getNeighborsAlive([i, j]) {
  return neighborOffset
    .map(([_x, _y]) => [boundIndex(i + _x), boundIndex(j + _y)])
    .filter(isCellAlive);
}

//Циклическое вычисление новых поколений
function runGeneration() {
  if (!isRunning) return;

  const time = performance.now();

  createCellMap();
  let nextGenStorage = [];
  for (let c of storage) {
    const cellsToAdd = getNeighborsAlive(c, nextGenStorage);
    if (isCellAlive(c)) cellsToAdd.push(c);
    nextGenStorage.push(...cellsToAdd.filter((c) => !isIn(nextGenStorage, c)));
  }

  const endByFreeze =
    storage.length === nextGenStorage.length &&
    storage.every((c) => isIn(nextGenStorage, c));
  storage = nextGenStorage;
  drawCells();

  genTime = performance.now() - time;

  sumTime += genTime;
  document.getElementById("genTime").innerHTML = genTime.toFixed(2) + " мс";
  document.getElementById("sumTime").innerHTML = sumTime.toFixed(2) + " мс";
  generation++;
  document.getElementById("generation").innerHTML = generation;

  if (storage.length == 0 || endByFreeze) stopLife();
  else timer = setTimeout(runGeneration, 300);
}

//Проверяет была ли клетка живой в предыдушем поколении по списку клеток
function isIn(storage, [i, j]) {
  return storage.some(([x, y]) => x == i && y == j);
}

//Проверяет была ли клетка живой в предыдушем поколении по карте клеток
function isInCellMap(i, j) {
  return cellMap[i] ? cellMap[i][j] : false;
}

//Создание вспомогательной карты клеток
function createCellMap() {
  cellMap = [];
  for (const [x, y] of storage) {
    if (!cellMap[x]) cellMap[x] = [];
    cellMap[x][y] = true;
  }
}

//Удаление живых клеток, которые не вошли в игровое поле
function cutStorage() {
  storage = storage.filter(([x, y]) => x < numberOfCells && y < numberOfCells);
}

//Обработка нажаний на игровое поле
canvasCells.onclick = function (event) {
  let x = event.offsetX;
  let y = event.offsetY;
  x = Math.floor(x / cellSize);
  y = Math.floor(y / cellSize);
  if (!isIn(storage, [x, y])) {
    storage.push([x, y]);
    document.getElementById("clear").disabled = false;
  }
  drawCells();
};

resetCanvasSize();
drawGrid();
document.getElementById("apply").onclick = applyNewSize;
document.getElementById("start").onclick = runLife;
document.getElementById("stop").onclick = stopLife;
document.getElementById("clear").onclick = clearLife;
