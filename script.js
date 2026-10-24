const display = document.querySelector("#display");
const expression = document.querySelector("#expression");
const keypad = document.querySelector("#keypad");
const historyPanel = document.querySelector("#historyPanel");
const historyToggle = document.querySelector("#historyToggle");
const historyList = document.querySelector("#historyList");

let currentInput = "0";
let storedValue = null;
let pendingOperator = null;
let waitingForNextInput = false;
let justCalculated = false;
let calculationHistory = [];

const operatorNames = { "+": "+", "−": "−", "×": "×", "÷": "÷" };

function updateDisplay() {
  display.textContent = currentInput;
}

function formatNumber(number) {
  if (!Number.isFinite(number)) return "Error";
  const rounded = Number.parseFloat(number.toPrecision(12));
  return String(rounded);
}

function clearAll() {
  currentInput = "0";
  storedValue = null;
  pendingOperator = null;
  waitingForNextInput = false;
  justCalculated = false;
  expression.textContent = "\u00a0";
  document.querySelectorAll(".key.operator").forEach(button => button.classList.remove("selected"));
  updateDisplay();
}

function enterDigit(digit) {
  if (currentInput === "Error" || waitingForNextInput || justCalculated) {
    currentInput = digit;
    waitingForNextInput = false;
    justCalculated = false;
    if (!pendingOperator) expression.textContent = "\u00a0";
  } else if (currentInput === "0") {
    currentInput = digit;
  } else if (currentInput.length < 15) {
    currentInput += digit;
  }
  updateDisplay();
}

function enterDecimal() {
  if (currentInput === "Error" || waitingForNextInput || justCalculated) {
    currentInput = "0.";
    waitingForNextInput = false;
    justCalculated = false;
    if (!pendingOperator) expression.textContent = "\u00a0";
  } else if (!currentInput.includes(".")) {
    currentInput += ".";
  }
  updateDisplay();
}

function calculate(left, right, operator) {
  switch (operator) {
    case "+": return left + right;
    case "−": return left - right;
    case "×": return left * right;
    case "÷": return right === 0 ? NaN : left / right;
    default: return right;
  }
}

function chooseOperator(operator) {
  if (currentInput === "Error") return;
  const inputValue = Number(currentInput);

  if (pendingOperator && !waitingForNextInput) {
    const result = calculate(storedValue, inputValue, pendingOperator);
    if (!Number.isFinite(result)) {
      currentInput = "Error";
      expression.textContent = "Cannot divide by zero";
      storedValue = null;
      pendingOperator = null;
      updateDisplay();
      return;
    }
    currentInput = formatNumber(result);
    storedValue = result;
    updateDisplay();
  } else {
    storedValue = inputValue;
  }

  pendingOperator = operator;
  waitingForNextInput = true;
  justCalculated = false;
  expression.textContent = `${formatNumber(storedValue)} ${operatorNames[operator]}`;
  document.querySelectorAll(".key.operator").forEach(button => {
    button.classList.toggle("selected", button.dataset.operator === operator);
  });
}

function runCalculation() {
  if (!pendingOperator || storedValue === null || currentInput === "Error") return;
  const left = storedValue;
  const right = Number(currentInput);
  const operator = pendingOperator;
  const result = calculate(left, right, operator);
  const readableExpression = `${formatNumber(left)} ${operator} ${formatNumber(right)} =`;

  if (!Number.isFinite(result)) {
    currentInput = "Error";
    expression.textContent = "Cannot divide by zero";
  } else {
    currentInput = formatNumber(result);
    expression.textContent = readableExpression;
    addToHistory(readableExpression, currentInput);
  }

  storedValue = null;
  pendingOperator = null;
  waitingForNextInput = false;
  justCalculated = true;
  document.querySelectorAll(".key.operator").forEach(button => button.classList.remove("selected"));
  updateDisplay();
}

function deleteLast() {
  if (currentInput === "Error" || waitingForNextInput || justCalculated) {
    currentInput = "0";
    waitingForNextInput = false;
    justCalculated = false;
  } else if (currentInput.length > 1) {
    currentInput = currentInput.slice(0, -1);
    if (currentInput === "-") currentInput = "0";
  } else {
    currentInput = "0";
  }
  updateDisplay();
}

function toggleSign() {
  if (currentInput === "Error" || Number(currentInput) === 0) return;
  currentInput = currentInput.startsWith("-") ? currentInput.slice(1) : `-${currentInput}`;
  updateDisplay();
}

function applyPercent() {
  if (currentInput === "Error") return;
  currentInput = formatNumber(Number(currentInput) / 100);
  updateDisplay();
}

function addToHistory(formula, result) {
  calculationHistory.unshift({ formula, result });
  calculationHistory = calculationHistory.slice(0, 8);
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";
  if (calculationHistory.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-history";
    empty.textContent = "Your calculations will appear here.";
    historyList.append(empty);
    return;
  }

  calculationHistory.forEach(item => {
    const li = document.createElement("li");
    const formula = document.createElement("span");
    const result = document.createElement("span");
    formula.textContent = item.formula;
    result.textContent = item.result;
    li.append(formula, result);
    historyList.append(li);
  });
}

keypad.addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.digit !== undefined) enterDigit(button.dataset.digit);
  else if (button.dataset.operator) chooseOperator(button.dataset.operator);
  else {
    switch (button.dataset.action) {
      case "clear": clearAll(); break;
      case "delete": deleteLast(); break;
      case "decimal": enterDecimal(); break;
      case "sign": toggleSign(); break;
      case "percent": applyPercent(); break;
      case "equals": runCalculation(); break;
    }
  }
});

document.addEventListener("keydown", event => {
  if (/^[0-9]$/.test(event.key)) enterDigit(event.key);
  else if (event.key === ".") enterDecimal();
  else if (event.key === "+" || event.key === "-") chooseOperator(event.key === "-" ? "−" : "+");
  else if (event.key === "*") chooseOperator("×");
  else if (event.key === "/") { event.preventDefault(); chooseOperator("÷"); }
  else if (event.key === "Enter" || event.key === "=") { event.preventDefault(); runCalculation(); }
  else if (event.key === "Backspace") deleteLast();
  else if (event.key === "Escape") clearAll();
  else if (event.key === "%") applyPercent();
});

historyToggle.addEventListener("click", () => {
  const isHidden = historyPanel.hidden;
  historyPanel.hidden = !isHidden;
  historyToggle.setAttribute("aria-expanded", String(isHidden));
});

document.querySelector("#clearHistory").addEventListener("click", () => {
  calculationHistory = [];
  renderHistory();
});

document.querySelector("#year").textContent = new Date().getFullYear();
renderHistory();
updateDisplay();
