let questions = [];
let currentQuestion = 0;
let score = 0;
let gameState = 'quiz';
let particles = [];
let stars = [];
let confetti = [];
let mouseParticles = [];
let hoverOption = -1;
let buttonAnimation = {};
let inputLocked = false; 

function preload() {
    loadStrings('questions.csv', processCSV);
}

// [修正] 處理題目中包含逗號 (,) 的情況
function processCSV(data) {
    for (let i = 1; i < data.length; i++) {
        if (data[i].trim() === '') continue;
        
        let values = data[i].split(',');
        
        if (values.length > 6) { 
            // 從後面反向取出固定的 5 個欄位 (A, B, C, D, 答案)
            let answer = values[values.length - 1].trim();
            let optionD = values[values.length - 2];
            let optionC = values[values.length - 3];
            let optionB = values[values.length - 4];
            let optionA = values[values.length - 5];
            
            // 將前面的所有部分重新組合回「題目」
            let questionParts = values.slice(0, values.length - 5);
            let question = questionParts.join(','); 
            
            questions.push({
                question: question,
                options: [optionA, optionB, optionC, optionD],
                correct: answer
            });
        } else if (values.length === 6) { 
            // 這是標準格式 (題目中沒有逗號)
            questions.push({
                question: values[0],
                options: [values[1], values[2], values[3], values[4]],
                correct: values[5].trim()
            });
        }
    }
}


function setup() {
    let canvas = createCanvas(800, 600);
    canvas.parent('canvas-container');
    textAlign(CENTER, CENTER); 
    
    for (let i = 0; i < 4; i++) {
        buttonAnimation[i] = { scale: 1, glow: 0 };
    }
    
    for (let i = 0; i < 50; i++) {
        stars.push({
            x: random(width),
            y: random(height),
            size: random(1, 3),
            alpha: random(100, 255)
        });
    }
}

function draw() {
    drawGradientBackground();
    drawStars();
    drawMouseParticles();
    
    if (gameState === 'quiz') {
        drawQuiz();
    } else if (gameState === 'result') {
        drawResult();
    }
}

function drawGradientBackground() {
    for (let y = 0; y < height; y++) {
        let inter = map(y, 0, height, 0, 1);
        let c = lerpColor(color(135, 206, 250), color(255, 182, 193), inter);
        stroke(c);
        line(0, y, width, y);
    }
}

function drawStars() {
    noStroke();
    for (let star of stars) {
        star.alpha += sin(frameCount * 0.05 + star.x) * 2;
        fill(255, 255, 255, star.alpha);
        circle(star.x, star.y, star.size);
    }
}

function drawMouseParticles() {
    if (frameCount % 3 === 0) {
        mouseParticles.push({
            x: mouseX,
            y: mouseY,
            size: random(5, 15),
            life: 255,
            vx: random(-1, 1),
            vy: random(-1, 1)
        });
    }
    
    for (let i = mouseParticles.length - 1; i >= 0; i--) {
        let mp = mouseParticles[i];
        mp.x += mp.vx;
        mp.y += mp.vy;
        mp.life -= 5;
        mp.size *= 0.95;
        
        noStroke();
        fill(255, 200, 100, mp.life);
        circle(mp.x, mp.y, mp.size);
        
        if (mp.life <= 0) {
            mouseParticles.splice(i, 1);
        }
    }
}

// [修正] 修正文字換行 和 置中問題
function drawQuiz() {
    if (questions.length === 0) {
        fill(255);
        textSize(20);
        textAlign(CENTER, CENTER);
        text('載入題目中...', width/2, height/2);
        return;
    }
    
    let q = questions[currentQuestion];
    
    textAlign(CENTER, CENTER); 
    
    fill(255);
    textSize(28);
    textStyle(BOLD);
    text('第 ' + (currentQuestion + 1) + ' 題 / 共 ' + questions.length + ' 題', width/2, 50);
    
    // [修正] 題目文字自動換行與置中
    textSize(22);
    textStyle(NORMAL);
    fill(50);
    textAlign(CENTER, TOP);
    let q_x = width / 2;
    let q_y = 100;
    let q_w = width * 0.8;
    let q_h = 100;
    text(q.question, q_x - q_w/2, q_y, q_w, q_h);
    
    let optionLabels = ['A', 'B', 'C', 'D'];
    let isAnyButtonHovered = false; 
    
    for (let i = 0; i < 4; i++) {
        let y = 220 + i * 80; 
        let isHover = mouseX > 150 && mouseX < 650 && 
                     mouseY > y - 25 && mouseY < y + 25;
        
        if (isHover) {
            isAnyButtonHovered = true; 
        }
        
        if (isHover && hoverOption !== i) {
            hoverOption = i;
            createHoverEffect(400, y);
        }
        
        if (isHover) {
            buttonAnimation[i].scale = lerp(buttonAnimation[i].scale, 1.05, 0.1);
            buttonAnimation[i].glow = lerp(buttonAnimation[i].glow, 20, 0.1);
        } else {
            buttonAnimation[i].scale = lerp(buttonAnimation[i].scale, 1, 0.1);
            buttonAnimation[i].glow = lerp(buttonAnimation[i].glow, 0, 0.1);
        }
        
        push();
        translate(400, y);
        scale(buttonAnimation[i].scale);
        
        if (buttonAnimation[i].glow > 0) {
            noFill();
            stroke(255, 200, 100, buttonAnimation[i].glow);
            strokeWeight(3);
            rect(-250, -25, 500, 50, 10);
        }
        
        noStroke();
        if (isHover) {
            fill(255, 200, 100);
        } else {
            fill(100, 180, 255);
        }
        rect(-250, -25, 500, 50, 10);
        
        fill(255);
        textSize(18);
        textAlign(LEFT, CENTER);
        text(optionLabels[i] + '. ' + q.options[i], -230, 0);
        
        pop();
    }
    
    if (!isAnyButtonHovered) {
        hoverOption = -1;
    }
    
    // [修正] 分數文字置中問題
    push(); 
    fill(255, 100, 100);
    textSize(20);
    textAlign(RIGHT, TOP);
    text('⭐ 目前分數: ' + score, width - 30, 30);
    pop(); 
    
    updateParticles();
}


function createHoverEffect(x, y) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: random(-3, 3),
            vy: random(-3, 3),
            life: 255,
            size: random(3, 8),
            r: 100,
            g: 200,
            b: 255
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let part = particles[i];
        part.x += part.vx;
        part.y += part.vy;
        part.life -= 10;
        
        noStroke();
        fill(part.r, part.g, part.b, part.life);
        circle(part.x, part.y, part.size);
        
        if (part.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawResult() {
    let percentage = (score / questions.length) * 100;
    
    updateConfetti();
    
    textAlign(CENTER, CENTER);
    fill(50);
    textSize(40);
    textStyle(BOLD);
    
    if (percentage >= 80) {
        text('🎉 太棒了！', width/2, 120);
        textSize(26);
        textStyle(NORMAL);
        text('你真是天才！', width/2, 170);
        drawCelebration();
    } else if (percentage >= 60) {
        text('👍 很不錯喔！', width/2, 120);
        textSize(26);
        textStyle(NORMAL);
        text('繼續加油，你會更棒的！', width/2, 170);
        drawEncouragement();
    } else {
        text('💪 加油！', width/2, 120);
        textSize(26);
        textStyle(NORMAL);
        text('沒關係，下次一定會更好！', width/2, 170);
        drawMotivation();
    }
    
    textSize(56);
    fill(255, 100, 100);
    text(score + ' / ' + questions.length, width/2, 260);
    
    textSize(32);
    fill(100, 150, 255);
    text(percentage.toFixed(0) + ' 分', width/2, 320);
    
    drawRestartButton();
}

function drawCelebration() {
    if (frameCount % 5 === 0) {
        confetti.push({
            x: random(width),
            y: 0,
            vy: random(2, 5),
            vx: random(-1, 1),
            rotation: random(TWO_PI),
            rotationSpeed: random(-0.1, 0.1),
            r: random(255),
            g: random(255),
            b: random(255),
            size: random(5, 10)
        });
    }
}

function updateConfetti() {
    for (let i = confetti.length - 1; i >= 0; i--) {
        let c = confetti[i];
        c.x += c.vx;
        c.y += c.vy;
        c.rotation += c.rotationSpeed;
        
        push();
        translate(c.x, c.y);
        rotate(c.rotation);
        noStroke();
        fill(c.r, c.g, c.b);
        rect(-c.size/2, -c.size/2, c.size, c.size);
        pop();
        
        if (c.y > height) {
            confetti.splice(i, 1);
        }
    }
}

function drawEncouragement() {
    let pulse = sin(frameCount * 0.1) * 10;
    noStroke();
    fill(100, 200, 100, 100);
    circle(width/2, 400, 100 + pulse);
}

function drawMotivation() {
    let offset = sin(frameCount * 0.05) * 20;
    for (let i = 0; i < 3; i++) {
        noStroke();
        fill(255, 150, 100, 50);
        circle(width/2 - 60 + i * 60, 400 + offset, 40);
    }
}

function drawRestartButton() {
    let y = 450;
    let isHover = mouseX > 300 && mouseX < 500 && 
                 mouseY > y - 25 && mouseY < y + 25;
    
    push();
    translate(400, y);
    
    if (isHover) {
        fill(255, 150, 100);
        scale(1.05);
    } else {
        fill(100, 180, 255);
    }
    
    noStroke();
    rect(-100, -25, 200, 50, 10);
    fill(255);
    textSize(24);
    textAlign(CENTER, CENTER); 
    text('再玩一次', 0, 0);
    pop();
}

// [修正] 防止重複點擊
function mousePressed() {
    if (gameState === 'quiz' && !inputLocked && questions.length > 0) {
        for (let i = 0; i < 4; i++) {
            let y = 200 + i * 80;
            if (mouseX > 150 && mouseX < 650 && 
                mouseY > y - 25 && mouseY < y + 25) {
                
                inputLocked = true; 
                
                createSelectEffect(400, y);
                
                let q = questions[currentQuestion];
                let correctIndex = q.correct.charCodeAt(0) - 65;
                
                if (i === correctIndex) {
                    score++;
                }
                
                setTimeout(function() {
                    currentQuestion++;
                    if (currentQuestion >= questions.length) {
                        gameState = 'result';
                    }
                    inputLocked = false; 
                }, 300);
                
                break;
            }
        }
    } else if (gameState === 'result') {
        let y = 450;
        if (mouseX > 300 && mouseX < 500 && 
            mouseY > y - 25 && mouseY < y + 25) {
            currentQuestion = 0;
            score = 0;
            gameState = 'quiz';
            confetti = [];
            particles = [];
            inputLocked = false; 
        }
    }
}

function createSelectEffect(x, y) {
    for (let i = 0; i < 30; i++) {
        let angle = random(TWO_PI);
        let speed = random(2, 8);
        particles.push({
            x: x,
            y: y,
            vx: cos(angle) * speed,
            vy: sin(angle) * speed,
            life: 255,
            size: random(5, 12),
            r: 255,
            g: 200,
            b: 100
        });
    }
}