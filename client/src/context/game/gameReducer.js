import {
  CREATE_GAME,
  JOIN_GAME,
  GAME_JOINED,
  GAME_STARTED,
  MAKE_MOVE,
  MOVE_MADE,
  GAME_OVER,
  CREATE_AI_GAME,
  REQUEST_AI_MOVE,
  RESIGN_GAME,
  OFFER_DRAW,
  DRAW_OFFERED,
  RESPOND_TO_DRAW,
  DRAW_RESPONSE,
  SET_FEN,
  CLEAR_GAME,
  GAME_ERROR,
  PLAYER_DISCONNECTED,
  PLAYER_RECONNECTED,
  MESSAGE_SENT,
  MESSAGE_RECEIVED,
  CLEAR_MESSAGES,
  GET_HISTORY,
  GET_ACTIVE_GAMES,
  LOADING,
  CLEAR_LOADING
} from '../types';

const gameReducer = (state, action) => {
  switch (action.type) {
    case CREATE_GAME:
      return {
        ...state,
        gameId: action.payload.gameId,
        playerId: action.payload.playerId,
        playerName: action.payload.playerName,
        loading: false
      };
    case JOIN_GAME:
      return {
        ...state,
        gameId: action.payload.gameId,
        playerId: action.payload.playerId,
        playerName: action.payload.playerName,
        loading: false
      };
    case GAME_JOINED:
      return {
        ...state,
        gameId: action.payload.gameId,
        playerColor: action.payload.color,
        status: action.payload.status,
        fen: action.payload.fen,
        opponentName: action.payload.opponent ? action.payload.opponent.name : null,
        opponentId: action.payload.opponent ? action.payload.opponent.id : null,
        isSpectator: action.payload.isSpectator || false,
        loading: false
      };
    case GAME_STARTED:
      return {
        ...state,
        status: action.payload.status,
        opponentName: action.payload.opponent ? action.payload.opponent.name : state.opponentName,
        opponentId: action.payload.opponent ? action.payload.opponent.id : state.opponentId,
        loading: false
      };
    case MAKE_MOVE:
      return {
        ...state,
        loading: true
      };
    case MOVE_MADE:
      return {
        ...state,
        fen: action.payload.fen,
        turn: action.payload.turn,
        status: action.payload.status,
        result: action.payload.result,
        moveHistory: [...state.moveHistory, action.payload.move],
        loading: false
      };
    case GAME_OVER:
      return {
        ...state,
        status: action.payload.status,
        result: action.payload.result,
        loading: false
      };
    case CREATE_AI_GAME:
      return {
        ...state,
        playerId: action.payload.playerId,
        playerName: action.payload.playerName,
        isAgainstAI: true,
        aiLevel: action.payload.aiLevel,
        loading: false
      };
    case REQUEST_AI_MOVE:
      return {
        ...state,
        loading: true
      };
    case RESIGN_GAME:
      return {
        ...state,
        loading: true
      };
    case OFFER_DRAW:
      return {
        ...state,
        loading: true
      };
    case DRAW_OFFERED:
      return {
        ...state,
        drawOffer: {
          from: action.payload.from,
          timestamp: new Date().toISOString()
        },
        loading: false
      };
    case RESPOND_TO_DRAW:
      return {
        ...state,
        drawOffer: null,
        loading: true
      };
    case DRAW_RESPONSE:
      return {
        ...state,
        drawOffer: null,
        loading: false
      };
    case SET_FEN:
      return {
        ...state,
        fen: action.payload,
        loading: false
      };
    case PLAYER_DISCONNECTED:
      return {
        ...state,
        status: state.status === 'active' ? 'opponent disconnected' : state.status,
        loading: false
      };
    case PLAYER_RECONNECTED:
      return {
        ...state,
        status: 'active',
        loading: false
      };
    case MESSAGE_SENT:
      return {
        ...state,
        messages: [...state.messages, action.payload],
        loading: false
      };
    case MESSAGE_RECEIVED:
      return {
        ...state,
        messages: [...state.messages, action.payload],
        loading: false
      };
    case GET_HISTORY:
      return {
        ...state,
        gameHistory: action.payload,
        loading: false
      };
    case GET_ACTIVE_GAMES:
      return {
        ...state,
        activeGames: action.payload,
        loading: false
      };
    case LOADING:
      return {
        ...state,
        loading: true
      };
    case CLEAR_LOADING:
      return {
        ...state,
        loading: false,
        error: null
      };
    case CLEAR_GAME:
      return {
        ...state,
        gameId: null,
        playerColor: null,
        opponentName: null,
        opponentId: null,
        isAgainstAI: false,
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        status: null,
        result: null,
        turn: 'w',
        drawOffer: null,
        isSpectator: false,
        spectatorCount: 0,
        moveHistory: [],
        loading: false
      };
    case CLEAR_MESSAGES:
      return {
        ...state,
        messages: []
      };
    case GAME_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    default:
      return state;
  }
};

export default gameReducer;