let matchedPairs = 0;
let totalPairs;
let clickCount = 0;
let timer; 
let timerInterval = null;
let gameActive = false;
let canFlip = false;

const difficultySettings = {
  easy:   { pairs: 3,  time: 10 },
  medium: { pairs: 6,  time: 30 },
  hard:   { pairs: 10, time: 45 }
};

$(document).ready(() => {
  let difficulty = $('input[name="difficulty"]:checked').val() || 'easy';
  setupGame(difficulty);
  setupResetButton();
  setupStartButton();
  setupDifficultyChangeListener();
  setupThemeToggle();
  setupGuaranteedMatch();
});


async function setupGame(difficulty) {
  const settings = difficultySettings[difficulty];
  totalPairs = settings.pairs;
  timer = settings.time;

  matchedPairs = 0;
  clickCount = 0;
  gameActive = true;
  canFlip = false;

  $("#game-board").removeClass("easy medium hard");

  $("#game-board").addClass(difficulty);

  hideWinMessage();
  hideGameOverMessage();
  updateGridLayout(totalPairs);

  $('#click-count').text(clickCount);
  $('#matched-count').text(matchedPairs);
  $('#pairs-left-count').text(totalPairs - matchedPairs);
  $('#total-pairs-count').text(totalPairs);
  $('#timer').text(timer);

  clearInterval(timerInterval);
  $('#start-btn').prop('disabled', false);

  const pokemonList = await getRandomPokemon(totalPairs);
  const cardData = shuffle([...pokemonList, ...pokemonList]);

  const board = $("#game-board");
  board.empty();

  cardData.forEach((pokemon) => {
    const card = $(`
      <div class="card">
        <div class="card-inner">
          <div class="front_face">
            <img src="${pokemon.image}" alt="${pokemon.name}">
          </div>
          <div class="back_face"></div>
        </div>
      </div>
    `);
    board.append(card);
  });

  setupFlipLogic();
}


async function getRandomPokemon(count) {
  const total = 151;
  const ids = new Set();

  while (ids.size < count) {
    ids.add(Math.floor(Math.random() * total) + 1);
  }

  const promises = [...ids].map(async (id) => {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const data = await res.json();
    return {
      name: data.name,
      image: data.sprites.other['official-artwork'].front_default
    };
  });

  return await Promise.all(promises);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function setupFlipLogic() {
  let firstCard = null;
  let secondCard = null;
  let lockBoard = false;

  $(".card").on("click", function () {
    if (lockBoard || $(this).hasClass("flip") || !gameActive || !canFlip) return;

    clickCount++;
    $('#click-count').text(clickCount);

    $(this).addClass("flip");
    const currentCard = $(this).find(".front_face img")[0];

    if (!firstCard) {
      firstCard = currentCard;
    } else {
      secondCard = currentCard;
      lockBoard = true;

      checkForMatch(firstCard, secondCard, () => {
        resetFlipVars();
        lockBoard = false;

        if (matchedPairs === totalPairs) {
        gameActive = false;
        clearInterval(timerInterval);
        showWinMessage();

        // Disable power-ups when game is won
        $('#match-btn').prop('disabled', true);
        $('#reveal-btn').prop('disabled', true);
    }

      });
    }
  });

  function resetFlipVars() {
    firstCard = null;
    secondCard = null;
  }
}

function checkForMatch(card1, card2, callback) {
  if (card1.src === card2.src) {
    // Match found
    $(card1).closest(".card").off("click");
    $(card2).closest(".card").off("click");
    matchedPairs++;

    $('#matched-count').text(matchedPairs);
    $('#pairs-left-count').text(totalPairs - matchedPairs);

    if (matchedPairs === totalPairs) {
      gameActive = false;
      clearInterval(timerInterval);
      showWinMessage();
    }
    callback();
  } else {
    // No match
    setTimeout(() => {
      $(card1).closest(".card").removeClass("flip");
      $(card2).closest(".card").removeClass("flip");
      callback();
    }, 1000);
  }
}

function updateGridLayout(totalPairs) {
  const board = $('#game-board');
  const totalCards = totalPairs * 2;

  // Prefer horizontal layout by default
  let columns;

  if (totalCards <= 6) {
    columns = 3; // 3x2 for easy
  } else if (totalCards <= 12) {
    columns = 4; // 4x3 for medium
  } else {
    columns = 5; // 5x4 for hard
  }

  board.css('grid-template-columns', `repeat(${columns}, 1fr)`);
}


function showWinMessage() {
  $('#win-message').show();
}

function hideWinMessage() {
  $('#win-message').hide();
}

function showGameOverMessage() {
  $('#game-over-message').show();
}

function hideGameOverMessage() {
  $('#game-over-message').hide();
}

function setupResetButton() {
  $('#reset-btn').off('click').on('click', () => {
    let difficulty = $('input[name="difficulty"]:checked').val() || 'easy';
    $('#start-btn').prop('disabled', false);

    // Disable power-up buttons on reset
    $('#match-btn').prop('disabled', true);
    $('#reveal-btn').prop('disabled', true);

    setupGame(difficulty);
  });
}

function setupDifficultyChangeListener() {
  $('input[name="difficulty"]').on('change', function() {
    let selectedDifficulty = $(this).val();
    setupGame(selectedDifficulty);
  });
}

function setupStartButton() {
  $('#start-btn').off('click').on('click', () => {
  canFlip = true;
  $('#start-btn').prop('disabled', true);

  // Enable power-up buttons when game starts
  $('#match-btn').prop('disabled', false);
  $('#reveal-btn').prop('disabled', false);

  timerInterval = setInterval(() => {
    if (!gameActive) {
      clearInterval(timerInterval);
      return;
    }
    timer--;
    $('#timer').text(timer);

    if (timer <= 0) {
      clearInterval(timerInterval);
      gameActive = false;
      canFlip = false;
      showGameOverMessage();

      $(".card").off("click");

      // Disable power-up buttons on game over
      $('#match-btn').prop('disabled', true);
      $('#reveal-btn').prop('disabled', true);
    }
  }, 1000);
});
}

function setupThemeToggle() {
  $('input[name="theme"]').on('change', function () {
    const selectedTheme = $(this).val();
    $('body').removeClass('light-theme dark-theme').addClass(`${selectedTheme}-theme`);
  });

  // Set initial theme
  const initialTheme = $('input[name="theme"]:checked').val();
  $('body').addClass(`${initialTheme}-theme`);
}

function setupGuaranteedMatch() {
  $('#match-btn').on('click', () => {
    
    if (!gameActive) return;

    let images = {};
    let match = [];

    $('.card').each(function () {
      if ($(this).hasClass('flip')) return; // already flipped
      if (gameActive && !canFlip) return; // game not active
      

      const src = $(this).find('.front_face img').attr('src');

      if (images[src]) {
        match = [images[src], this];
        return false; // exit loop early
      } else {
        images[src] = this;
      }
    });

    if (match.length === 2) {
      $(match[0]).addClass('flip').off('click');
      $(match[1]).addClass('flip').off('click');
      matchedPairs++;
      $('#matched-count').text(matchedPairs);
      $('#pairs-left-count').text(totalPairs - matchedPairs);

      if (matchedPairs === totalPairs) {
        gameActive = false;
        clearInterval(timerInterval);
        showWinMessage();
      }
    }

    $('#match-btn').prop('disabled', true); // optional: one-time use
  });
}
