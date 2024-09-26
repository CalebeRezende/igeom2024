var width = document.getElementById('stages').offsetWidth;
var height = 500;  // Altura fixa do canvas

var stage = new Konva.Stage({
  container: 'stages', 
  width: width,
  height: height,
});

var layer = new Konva.Layer();
stage.add(layer);

var points = [];  // Array para armazenar os pontos criados
var lines = [];   // Array para armazenar segmentos de reta e retas
var midPoints = []; // Array para armazenar todos os pontos médios
var dependencies = {}; // Objeto para armazenar dependências de pontos e segmentos

var mode = 'point'; // Variável para controlar a ação atual (adicionar ponto, criar reta, etc.)
var selectedPoints = []; // Array para armazenar os pontos selecionados para o segmento de reta
var proximityThreshold = 10; // Distância limite para detecção de cliques perto do ponto médio

// Função para criar pontos
function createPoint(x, y) {
  var point = new Konva.Circle({
    x: x,
    y: y,
    radius: 5,
    fill: 'red',
    stroke: 'black',
    strokeWidth: 2,
    draggable: true,
  });

  points.push(point);
  layer.add(point);
  layer.draw();

  point.on('dragmove', function () {
    updateDependencies(point); // Atualiza dependências ao arrastar o ponto
  });

  return point;
}

// Função para criar um ponto médio entre dois pontos
function createMidpoint(p1, p2) {
  var midX = (p1.x() + p2.x()) / 2;
  var midY = (p1.y() + p2.y()) / 2;

  var midPoint = new Konva.Circle({
    x: midX,
    y: midY,
    radius: 5,
    fill: 'none',
    stroke: 'black',
    strokeWidth: 2,
    draggable: true,
  });

  midPoints.push({ midPoint: midPoint, p1: p1, p2: p2 });
  layer.add(midPoint);
  layer.draw();

  // Dependência entre o ponto médio e seus pontos de origem
  addDependency(midPoint, p1, p2);

  midPoint.on('dragmove', function () {
    updateSegment(p1, p2);
    updateDependencies(midPoint); // Atualiza dependências ao arrastar o ponto médio
  });

  return midPoint;
}

// Função para calcular o ponto médio das distâncias X e Y dos pontos
function calculateAveragePoint(p1, p2) {
  var avgX = (p1.x() + p2.x()) / 2;
  var avgY = (p1.y() + p2.y()) / 2;
  return { x: avgX, y: avgY };
}

// Função para adicionar dependências
function addDependency(midPoint, p1, p2) {
  // Garante que o objeto de dependência para o ponto médio existe e inicializa dependents como array vazio
  if (!dependencies[midPoint._id]) {
    dependencies[midPoint._id] = { p1: p1, p2: p2, dependents: [] }; 
  }
  if (!dependencies[p1._id]) {
    dependencies[p1._id] = { midPoint: midPoint, otherPoint: p2 };
  }
  if (!dependencies[p2._id]) {
    dependencies[p2._id] = { midPoint: midPoint, otherPoint: p1 };
  }
}
// COLOCAR MIDPOINT PARA INVENTOR DE CADA UM. 
//CADA OBJETO TEM UM VETOR DEPENDENTE 
// Função para adicionar dependência de uma reta a um ponto médio
function addDependentToMidpoint(midPoint, line) {
  if (dependencies[midPoint._id]) {
    dependencies[midPoint._id].dependents.push(line); // Adiciona a nova reta como dependente
  }
}

// Função para verificar se há um ponto médio próximo do clique
function isNearMidpoint(mouseX, mouseY) {
  for (var i = 0; i < midPoints.length; i++) {
    var midPoint = midPoints[i].midPoint;
    var distance = Math.sqrt(Math.pow(mouseX - midPoint.x(), 2) + Math.pow(mouseY - midPoint.y(), 2));
    
    if (distance <= proximityThreshold) {
      return midPoint;
    }
  }
  return null;
}

// Função para perguntar ao usuário se deseja usar o ponto médio
function confirmUseMidpoint(midPoint) {
  return confirm("Você clicou perto de um ponto médio. Deseja criar uma reta a partir deste ponto?");
}

// Função para atualizar as dependências ao arrastar os pontos
function updateDependencies(point) {
  if (dependencies[point._id]) {
    var dep = dependencies[point._id];

    if (dep.midPoint) {
      // Atualiza o ponto médio com base no novo ponto arrastado
      var midX = (point.x() + dep.otherPoint.x()) / 2;
      var midY = (point.y() + dep.otherPoint.y()) / 2;
      dep.midPoint.x(midX);
      dep.midPoint.y(midY);
    }

    if (dep.p1 && dep.p2) {
      // Atualiza os pontos conectados ao ponto médio
      var p1 = dep.p1;
      var p2 = dep.p2;
      var midX = (p1.x() + p2.x()) / 2;
      var midY = (p1.y() + p2.y()) / 2;
      point.x(midX);
      point.y(midY);
    }

    // Atualiza qualquer reta dependente do ponto médio
    if (dep.dependents) {
      dep.dependents.forEach(function(line) {
        var p1 = line.p1;
        var p2 = line.p2;
        line.points([p1.x(), p1.y(), p2.x(), p2.y()]);
      });
    }

    layer.draw();
  }
}

// Função para atualizar todos os segmentos de reta associados aos pontos
function updateSegment(p1, p2) {
  lines.forEach(function(line) {
    if (line.p1 === p1 && line.p2 === p2) {
      line.points([p1.x(), p1.y(), p2.x(), p2.y()]);
    }
  });
  layer.draw();
}

// Função para criar segmento de reta entre dois pontos
function createSegment(p1, p2) {
  var line = new Konva.Line({
    points: [p1.x(), p1.y(), p2.x(), p2.y()],
    stroke: 'green',
    strokeWidth: 2,
    draggable: true,
  });

  line.p1 = p1;
  line.p2 = p2;

  lines.push(line);
  layer.add(line);
  layer.draw();

  var midPoint = createMidpoint(p1, p2);

  p1.on('dragmove', function () {
    line.points([p1.x(), p1.y(), p2.x(), p2.y()]);
    layer.draw();
    updateDependencies(p1); // Recalcula o ponto médio
  });

  p2.on('dragmove', function () {
    line.points([p1.x(), p1.y(), p2.x(), p2.y()]);
    layer.draw();
    updateDependencies(p2); // Recalcula o ponto médio
  });

  return midPoint;
}

// Função para criar uma nova reta com base na média das distâncias
function createSegmentWithAverage(p1, p2) {
  var avgPoint = calculateAveragePoint(p1, p2);
  var newPoint = createPoint(avgPoint.x, avgPoint.y); // Ponto inicial da nova reta com a média das distâncias
  createSegment(newPoint, p2); // Cria a reta com o ponto médio das distâncias
}

// Função para criar uma reta infinita
// Função para criar uma reta infinita com inclinação

function createLine(x, y, slope) {
  // Definir os dois pontos da reta
  var p1 = { x: 0, y: y }; // Ponto na borda esquerda (x=0)
  var p2 = { x: width, y: y + slope * width }; // Ponto na borda direita (com inclinação)

  var line = new Konva.Line({
    points: [p1.x, p1.y, p2.x, p2.y],
    stroke: 'blue',
    strokeWidth: 2,
    draggable: true,
  });

  lines.push(line);
  layer.add(line);
  layer.draw();

  // Permite arrastar a reta e recalcular a inclinação
  line.on('dragmove', function () {
    var newY = line.getY(); // Obtém a nova posição Y após o arrasto
    var deltaX = line.getX(); // Ajuste do ponto inicial em X (caso o usuário mova a linha lateralmente)

    // Atualiza os pontos da reta de acordo com o novo Y
    p1.y = newY; // Ajusta p1 para a nova posição Y
    p2.y = newY + slope * width; // Recalcula p2 com base na inclinação original

    line.points([p1.x + deltaX, p1.y, p2.x + deltaX, p2.y]); // Reposiciona a linha mantendo a inclinação
    layer.draw();
  });
}


// Função para criar uma circunferência
function createCircle(center, radius) {
  var circle = new Konva.Circle({
    x: center.x(),
    y: center.y(),
    radius: radius,
    stroke: 'blue',
    strokeWidth: 2,
  });

  layer.add(circle);
  layer.draw();
}

// Captura a posição do clique no canvas
stage.on('click', function (e) {
  var mousePos = stage.getPointerPosition();
  
  // Verifica se há um ponto médio próximo do clique
  var nearMidpoint = isNearMidpoint(mousePos.x, mousePos.y);
  if (nearMidpoint && confirmUseMidpoint(nearMidpoint)) {
    selectedPoints.push(nearMidpoint);
    if (selectedPoints.length === 2) {
      var newLine = createSegmentWithAverage(selectedPoints[0], selectedPoints[1]);
      addDependentToMidpoint(nearMidpoint, newLine); // Adiciona dependência da nova reta ao ponto médio
      selectedPoints = []; // Limpa os pontos selecionados após criar o segmento
    }
    return; // Sai da função após criar a reta
  }

  // Cria uma nova reta ou segmento baseado no modo ativo
  if (mode === 'point') {
    createPoint(mousePos.x, mousePos.y);
  } else if (mode === 'segment') {
    if (selectedPoints.length < 2) {
      var point = createPoint(mousePos.x, mousePos.y);
      selectedPoints.push(point);

      if (selectedPoints.length === 2) {
        createSegment(selectedPoints[0], selectedPoints[1]);
        selectedPoints = []; // Limpa os pontos selecionados após criar o segmento
      }
    }
  } else if (mode === 'line') {
    createLine(mousePos.x, mousePos.y);
  } else if (mode === 'circle') {
    if (selectedPoints.length === 0) {
      var center = createPoint(mousePos.x, mousePos.y);
      selectedPoints.push(center);
    } else if (selectedPoints.length === 1) {
      var radius = Math.sqrt(Math.pow(mousePos.x - selectedPoints[0].x(), 2) + Math.pow(mousePos.y - selectedPoints[0].y(), 2));
      createCircle(selectedPoints[0], radius);
      selectedPoints = [];
    }
  }
});

// Ações dos botões
document.getElementById('btn-point').addEventListener('click', function () {
  mode = 'point'; // Define o modo para adicionar ponto
});

document.getElementById('btn-segment').addEventListener('click', function () {
  mode = 'segment'; // Define o modo para criar segmento de reta
  selectedPoints = []; // Limpa os pontos selecionados
});

document.getElementById('btn-line').addEventListener('click', function () {
  mode = 'line'; // Define o modo para criar reta
});

document.getElementById('btn-circle').addEventListener('click', function () {
  mode = 'circle'; // Define o modo para criar circunferência
  selectedPoints = []; // Limpa os pontos selecionados
});
