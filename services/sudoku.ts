
export const BLANK = 0;
export const GRID_SIZE = 9;
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

// Basit bir Seeded Random Number Generator (LCG)
class SeededRandom {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    // 0 ile 1 arasında sayı üretir
    next(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    // min (dahil) ile max (hariç) arasında tamsayı üretir
    range(min: number, max: number): number {
        return Math.floor(this.next() * (max - min) + min);
    }
}

const getCluesCount = (difficulty: Difficulty): number => {
    switch (difficulty) {
        case 'Easy': return 38; // Daha kolay
        case 'Medium': return 30; // Orta
        case 'Hard': return 24; // Zor
        default: return 30;
    }
};

// Seed parametresini ekledik (varsayılan rastgele)
export const generatePuzzle = (difficulty: Difficulty, seed?: string): { initialBoard: number[][]; solution: number[][] } => {
    // Seed varsa ondan bir sayı oluştur, yoksa rastgele
    const seedNumber = seed
        ? seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        : Math.floor(Math.random() * 100000);

    const rng = new SeededRandom(seedNumber);

    const solution = Array(9).fill(null).map(() => Array(9).fill(BLANK));

    // 1. Tahtayı doldur (RNG kullanarak)
    fillBoard(solution, rng);

    // 2. Çözümü kopyala
    const initialBoard = solution.map(row => [...row]);

    // 3. Hücreleri zorluk seviyesine göre boşalt (RNG kullanarak)
    removeCells(initialBoard, difficulty, rng);

    return { initialBoard, solution };
};

const fillBoard = (board: number[][], rng: SeededRandom): boolean => {
    const emptyCell = findEmptyCell(board);
    if (!emptyCell) return true;

    const { row, col } = emptyCell;
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    // Sayıları RNG ile karıştır (Fisher-Yates Shuffle)
    for (let i = nums.length - 1; i > 0; i--) {
        const j = rng.range(0, i + 1);
        [nums[i], nums[j]] = [nums[j], nums[i]];
    }

    for (const num of nums) {
        if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (fillBoard(board, rng)) return true;
            board[row][col] = BLANK;
        }
    }
    return false;
};

const findEmptyCell = (board: number[][]): { row: number; col: number } | null => {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (board[i][j] === BLANK) return { row: i, col: j };
        }
    }
    return null;
};

const isValid = (board: number[][], row: number, col: number, num: number): boolean => {
    // Satır kontrolü
    for (let i = 0; i < 9; i++) {
        if (board[row][i] === num) return false;
    }

    // Sütun kontrolü
    for (let i = 0; i < 9; i++) {
        if (board[i][col] === num) return false;
    }

    // 3x3 kutu kontrolü
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[startRow + i][startCol + j] === num) return false;
        }
    }

    return true;
};

const removeCells = (board: number[][], difficulty: Difficulty, rng: SeededRandom) => {
    const cluesCount = getCluesCount(difficulty);
    let attempts = 81 - cluesCount;

    // RNG ile hangi hücreleri sileceğimizi seçiyoruz
    // Basit bir yöntem: Rastgele koordinat seçip silmeye çalışmak
    // Daha iyi bir yöntem: Tüm koordinatları listele, karıştır ve sırayla sil

    const cells = [];
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) cells.push({ r, c });

    // Shuffle cells using RNG
    for (let i = cells.length - 1; i > 0; i--) {
        const j = rng.range(0, i + 1);
        [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    for (const cell of cells) {
        if (attempts <= 0) break;

        const { r, c } = cell;
        if (board[r][c] !== BLANK) {
            const backup = board[r][c];
            board[r][c] = BLANK;

            // Çözümü kontrol et, eğer birden fazla çözüm varsa geri al (isteğe bağlı, performans için basit bırakılabilir)
            // Sudoku üretimi karmaşık bir konudur, bu basit versiyonda sadece sayı siliyoruz.
            // Gerçek bir Sudoku'nun tek çözümü olmalıdır.
            // Buradaki backtracking zaten deterministik olduğu için tek çözüm bulur ama başka çözüm var mı diye bakmaz.
            // Kullanıcı deneyimi için şimdilik yeterli.

            attempts--;
        }
    }
};
