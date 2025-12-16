class ScientificCalculator {
    constructor(previousOperandElement, currentOperandElement) {
        this.previousOperandElement = previousOperandElement;
        this.currentOperandElement = currentOperandElement;
        this.history = JSON.parse(localStorage.getItem('calculatorHistory')) || [];
        this.memory = 0;
        this.memoryActive = false;
        this.error = false;
        this.initialize();
    }

    initialize() {
        this.clear();
        this.updateHistory();
        this.updateMemoryIndicator();
    }

    clear() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
        this.clearError();
    }

    delete() {
        if (this.error) {
            this.clearError();
            return;
        }
        
        if (this.currentOperand === '0') return;
        
        this.currentOperand = this.currentOperand.toString().slice(0, -1);
        
        if (this.currentOperand === '' || this.currentOperand === '-') {
            this.currentOperand = '0';
        }
    }

    appendNumber(number) {
        if (this.error) {
            this.clearError();
            this.currentOperand = '';
        }

        if (number === '.' && this.currentOperand.includes('.')) return;
        
        if (this.currentOperand === '0' && number !== '.') {
            this.currentOperand = number.toString();
        } else {
            // Limitar la longitud para evitar números demasiado grandes
            if (this.currentOperand.replace('.', '').length >= 15) return;
            this.currentOperand = this.currentOperand.toString() + number.toString();
        }
    }

    chooseOperation(operation) {
        if (this.error) {
            this.showError('Operación no válida');
            return;
        }

        if (this.currentOperand === '') return;
        
        if (this.previousOperand !== '') {
            this.compute();
        }
        
        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.currentOperand = '0';
    }

    compute() {
        if (this.error) return;
        
        let computation;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);
        
        if (isNaN(prev) || isNaN(current)) return;
        
        try {
            switch (this.operation) {
                case '+':
                    computation = this.safeOperation(() => prev + current);
                    break;
                case '-':
                    computation = this.safeOperation(() => prev - current);
                    break;
                case '×':
                    computation = this.safeOperation(() => prev * current);
                    break;
                case '÷':
                    if (current === 0) {
                        throw new Error('División por cero');
                    }
                    computation = this.safeOperation(() => prev / current);
                    break;
                case '√':
                    if (current < 0) {
                        throw new Error('Raíz cuadrada de número negativo');
                    }
                    computation = this.safeOperation(() => Math.sqrt(current));
                    break;
                case '^':
                    computation = this.safeOperation(() => Math.pow(prev, current));
                    break;
                case 'sin':
                    computation = this.safeOperation(() => Math.sin(this.toRadians(current)));
                    break;
                case 'cos':
                    computation = this.safeOperation(() => Math.cos(this.toRadians(current)));
                    break;
                case 'tan':
                    computation = this.safeOperation(() => {
                        const rad = this.toRadians(current);
                        if (Math.cos(rad) === 0) {
                            throw new Error('Tangente indefinida');
                        }
                        return Math.tan(rad);
                    });
                    break;
                case '1/x':
                    if (current === 0) {
                        throw new Error('División por cero');
                    }
                    computation = this.safeOperation(() => 1 / current);
                    break;
                case '%':
                    computation = this.safeOperation(() => prev * (current / 100));
                    break;
                case '!':
                    if (!Number.isInteger(current) || current < 0) {
                        throw new Error('Factorial solo para enteros positivos');
                    }
                    computation = this.safeOperation(() => this.factorial(current));
                    break;
                default:
                    return;
            }
            
            // Verificar si el resultado es demasiado grande
            if (!Number.isFinite(computation)) {
                throw new Error('Número demasiado grande');
            }
            
            // Redondear para evitar errores de precisión
            computation = Math.round(computation * 100000000) / 100000000;
            
            // Guardar en historial
            let historyEntry;
            if (['sin', 'cos', 'tan', '√', '1/x', '!'].includes(this.operation)) {
                historyEntry = `${this.operation}(${this.currentOperand}) = ${computation}`;
            } else if (this.operation === '^') {
                historyEntry = `${this.previousOperand}^${this.currentOperand} = ${computation}`;
            } else {
                historyEntry = `${this.previousOperand} ${this.operation} ${this.currentOperand} = ${computation}`;
            }
            
            this.addToHistory(historyEntry);
            
            this.currentOperand = computation.toString();
            this.operation = undefined;
            this.previousOperand = '';
            
        } catch (error) {
            this.showError(error.message);
        }
    }

    safeOperation(operation) {
        const result = operation();
        if (!Number.isFinite(result)) {
            throw new Error('Resultado no finito');
        }
        return result;
    }

    factorial(n) {
        if (n > 170) {
            throw new Error('Factorial demasiado grande');
        }
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    toggleSign() {
        if (this.error) return;
        
        if (this.currentOperand.startsWith('-')) {
            this.currentOperand = this.currentOperand.slice(1);
        } else if (this.currentOperand !== '0') {
            this.currentOperand = '-' + this.currentOperand;
        }
    }

    // Funciones de memoria
    memoryClear() {
        this.memory = 0;
        this.memoryActive = false;
        this.updateMemoryIndicator();
    }

    memoryRecall() {
        if (this.error) return;
        this.currentOperand = this.memory.toString();
    }

    memoryAdd() {
        if (this.error) return;
        
        const current = parseFloat(this.currentOperand);
        if (!isNaN(current)) {
            this.memory += current;
            this.memoryActive = true;
            this.updateMemoryIndicator();
            this.showMessage(`Memoria: ${this.memory}`);
        }
    }

    // Manejo de errores
    showError(message) {
        this.error = true;
        this.currentOperandElement.classList.add('error');
        
        // Mostrar indicador de error
        const errorIndicator = document.getElementById('errorIndicator');
        errorIndicator.textContent = `ERROR: ${message}`;
        errorIndicator.classList.add('active');
        
        // Agregar al historial como error
        this.addToHistory(`ERROR: ${message}`, true);
    }

    clearError() {
        this.error = false;
        this.currentOperandElement.classList.remove('error');
        document.getElementById('errorIndicator').classList.remove('active');
    }

    showMessage(message) {
        const indicator = document.getElementById('operationIndicator');
        indicator.textContent = message;
        setTimeout(() => {
            indicator.textContent = '';
        }, 2000);
    }

    // Historial
    addToHistory(entry, isError = false) {
        const historyItem = {
            entry,
            timestamp: new Date().toLocaleTimeString(),
            isError
        };
        
        this.history.unshift(historyItem);
        if (this.history.length > 10) this.history.pop();
        localStorage.setItem('calculatorHistory', JSON.stringify(this.history));
        this.updateHistory();
    }

    updateHistory() {
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';
        
        this.history.forEach(item => {
            const div = document.createElement('div');
            div.classList.add('history-item');
            if (item.isError) div.classList.add('error');
            
            const timeSpan = document.createElement('span');
            timeSpan.textContent = `[${item.timestamp}] `;
            timeSpan.style.opacity = '0.6';
            timeSpan.style.fontSize = '0.8rem';
            
            div.appendChild(timeSpan);
            div.appendChild(document.createTextNode(item.entry));
            historyList.appendChild(div);
        });
    }

    clearHistory() {
        this.history = [];
        localStorage.removeItem('calculatorHistory');
        this.updateHistory();
    }

    updateMemoryIndicator() {
        const indicator = document.getElementById('memoryIndicator');
        if (this.memoryActive) {
            indicator.classList.add('active');
            indicator.innerHTML = `<i class="fas fa-sd-card"></i> M: ${this.memory}`;
        } else {
            indicator.classList.remove('active');
            indicator.innerHTML = `<i class="fas fa-sd-card"></i> M`;
        }
    }

    getDisplayNumber(number) {
        if (this.error) return 'ERROR';
        
        const stringNumber = number.toString();
        
        // Manejar números muy grandes
        if (stringNumber.length > 12) {
            if (parseFloat(stringNumber) > 1e12) {
                return parseFloat(stringNumber).toExponential(6);
            }
        }
        
        const integerDigits = parseFloat(stringNumber.split('.')[0]);
        const decimalDigits = stringNumber.split('.')[1];
        
        let integerDisplay;
        if (isNaN(integerDigits)) {
            integerDisplay = '';
        } else {
            integerDisplay = integerDigits.toLocaleString('es', {
                maximumFractionDigits: 0
            });
        }
        
        if (decimalDigits != null) {
            return `${integerDisplay}.${decimalDigits.slice(0, 8)}`;
        } else {
            return integerDisplay;
        }
    }

    updateDisplay() {
        this.currentOperandElement.textContent = this.getDisplayNumber(this.currentOperand);
        
        if (this.operation != null) {
            this.previousOperandElement.textContent =
                `${this.getDisplayNumber(this.previousOperand)} ${this.operation}`;
        } else {
            this.previousOperandElement.textContent = '';
        }
    }
}

// Inicializar calculadora
const calculator = new ScientificCalculator(
    document.getElementById('previousOperand'),
    document.getElementById('currentOperand')
);

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Botones numéricos
    document.querySelectorAll('[data-number]').forEach(button => {
        button.addEventListener('click', () => {
            calculator.appendNumber(button.dataset.number);
            calculator.updateDisplay();
        });
    });

    // Operaciones
    document.querySelectorAll('[data-operation]').forEach(button => {
        button.addEventListener('click', () => {
            calculator.chooseOperation(button.dataset.operation);
            calculator.updateDisplay();
        });
    });

    // Funciones especiales
    document.querySelector('[data-action="equals"]').addEventListener('click', () => {
        calculator.compute();
        calculator.updateDisplay();
    });

    document.querySelector('[data-action="clear"]').addEventListener('click', () => {
        calculator.clear();
        calculator.updateDisplay();
    });

    document.querySelector('[data-action="delete"]').addEventListener('click', () => {
        calculator.delete();
        calculator.updateDisplay();
    });

    // Botón de cambio de signo
    document.querySelector('[data-operation="±"]').addEventListener('click', () => {
        calculator.toggleSign();
        calculator.updateDisplay();
    });

    // Funciones de memoria
    document.querySelector('[data-action="memory-clear"]').addEventListener('click', () => {
        calculator.memoryClear();
        calculator.updateDisplay();
    });

    document.querySelector('[data-action="memory-recall"]').addEventListener('click', () => {
        calculator.memoryRecall();
        calculator.updateDisplay();
    });

    document.querySelector('[data-action="memory-add"]').addEventListener('click', () => {
        calculator.memoryAdd();
        calculator.updateDisplay();
    });

    // Limpiar historial
    document.getElementById('clearHistory').addEventListener('click', () => {
        calculator.clearHistory();
    });

    // Soporte para teclado
    document.addEventListener('keydown', (e) => {
        e.preventDefault();
        
        if (e.key >= '0' && e.key <= '9') {
            calculator.appendNumber(e.key);
            calculator.updateDisplay();
        }
        
        if (e.key === '.') {
            calculator.appendNumber('.');
            calculator.updateDisplay();
        }
        
        if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
            const operation = e.key === '*' ? '×' : e.key === '/' ? '÷' : e.key;
            calculator.chooseOperation(operation);
            calculator.updateDisplay();
        }
        
        if (e.key === 'Enter' || e.key === '=') {
            calculator.compute();
            calculator.updateDisplay();
        }
        
        if (e.key === 'Backspace') {
            calculator.delete();
            calculator.updateDisplay();
        }
        
        if (e.key === 'Escape') {
            calculator.clear();
            calculator.updateDisplay();
        }
        
        // Teclas especiales
        if (e.key === 'm' && e.ctrlKey) {
            calculator.memoryAdd();
            calculator.updateDisplay();
        }
        
        if (e.key === 'r' && e.ctrlKey) {
            calculator.memoryRecall();
            calculator.updateDisplay();
        }
        
        if (e.key === 's' && e.ctrlKey) {
            calculator.memoryClear();
            calculator.updateDisplay();
        }
    });
});

// Actualizar display inicial
calculator.updateDisplay();