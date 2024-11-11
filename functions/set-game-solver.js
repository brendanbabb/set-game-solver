// functions/set-game-solver.js

exports.handler = async (event, context) => {
  try {
    const cardsParam = event.queryStringParameters && event.queryStringParameters.cards;
    if (!cardsParam) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No cards parameter found in URL.' }),
      };
    }

    const cards = parseCards(cardsParam);
    if (!cards.length) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid card data provided.' }),
      };
    }

    const sets = findSets(cards);

    return {
      statusCode: 200,
      body: JSON.stringify({
        totalSetsFound: sets.length,
        sets: sets.map((set) => ({
          cards: set.map((c) => c.card),
          attributes: getSetAttributes(set),
        })),
      }),
    };
  } catch (error) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error.' }),
    };
  }
};

function parseCards(cardsParam) {
  const cardStrings = cardsParam.split(';');
  const cards = [];
  for (let cardStr of cardStrings) {
    const parts = cardStr.split(',').map((part) => part.trim());
    if (parts.length !== 5) {
      return [];
    }
    let [cardNum, colorCode, shapeCode, number, shadingCode] = parts;
    cardNum = parseInt(cardNum);
    number = parseInt(number);
    if (isNaN(cardNum) || isNaN(number)) {
      return [];
    }
    // Map codes to full words
    const colorMap = { re: 'Red', gr: 'Green', pu: 'Purple' };
    const shapeMap = { ov: 'Oval', sq: 'Squiggle', di: 'Diamond' };
    const shadingMap = { so: 'Solid', st: 'Striped', op: 'Open' };
    const color = colorMap[colorCode.toLowerCase()];
    const shape = shapeMap[shapeCode.toLowerCase()];
    const shading = shadingMap[shadingCode.toLowerCase()];
    if (!color || !shape || !shading) {
      return [];
    }
    cards.push({
      card: cardNum,
      color: color,
      shape: shape,
      number: number,
      shading: shading,
    });
  }
  return cards;
}

function findSets(cards) {
  let sets = [];
  const n = cards.length;
  for (let i = 0; i < n - 2; i++) {
    for (let j = i + 1; j < n - 1; j++) {
      for (let k = j + 1; k < n; k++) {
        if (isSet(cards[i], cards[j], cards[k])) {
          sets.push([cards[i], cards[j], cards[k]]);
        }
      }
    }
  }
  return sets;
}

function isSet(a, b, c) {
  const attributes = ['color', 'shape', 'number', 'shading'];
  for (let attr of attributes) {
    const vals = [a[attr], b[attr], c[attr]];
    const allSame = vals.every((v) => v === vals[0]);
    const allDifferent = new Set(vals).size === 3;
    if (!(allSame || allDifferent)) {
      return false;
    }
  }
  return true;
}

function getSetAttributes(set) {
  const attributes = ['color', 'shape', 'number', 'shading'];
  const attrDescriptions = [];
  for (let attr of attributes) {
    const vals = set.map((c) => c[attr]);
    const allSame = vals.every((v) => v === vals[0]);
    const allDifferent = new Set(vals).size === 3;
    if (allSame) {
      attrDescriptions.push({
        attribute: attr,
        type: 'all_same',
        value: vals[0],
      });
    } else if (allDifferent) {
      attrDescriptions.push({
        attribute: attr,
        type: 'all_different',
        values: vals,
      });
    }
  }
  return attrDescriptions;
}
