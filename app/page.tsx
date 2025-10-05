'use client'

import { useState, useEffect } from 'react'
import { Chess } from 'chess.js'
import styles from './page.module.css'

type Square = {
  square: string
  piece: string | null
}

const PIECE_SYMBOLS: { [key: string]: string } = {
  'p': '♟',
  'n': '♞',
  'b': '♝',
  'r': '♜',
  'q': '♛',
  'k': '♚',
  'P': '♙',
  'N': '♘',
  'B': '♗',
  'R': '♖',
  'Q': '♕',
  'K': '♔',
}

export default function Home() {
  const [game, setGame] = useState(new Chess())
  const [board, setBoard] = useState<Square[][]>([])
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [possibleMoves, setPossibleMoves] = useState<string[]>([])
  const [gameStatus, setGameStatus] = useState('')
  const [moveHistory, setMoveHistory] = useState<string[]>([])
  const [capturedPieces, setCapturedPieces] = useState({ white: [] as string[], black: [] as string[] })

  useEffect(() => {
    updateBoard()
  }, [])

  const updateBoard = () => {
    const newGame = new Chess(game.fen())
    const boardArray: Square[][] = []
    const squares = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

    for (let rank = 8; rank >= 1; rank--) {
      const row: Square[] = []
      for (const file of squares) {
        const square = `${file}${rank}`
        const piece = newGame.get(square as any)
        row.push({
          square,
          piece: piece ? piece.type + (piece.color === 'w' ? 'w' : 'b') : null
        })
      }
      boardArray.push(row)
    }

    setBoard(boardArray)
    updateGameStatus(newGame)
  }

  const updateGameStatus = (currentGame: Chess) => {
    if (currentGame.isCheckmate()) {
      setGameStatus(`Checkmate! ${currentGame.turn() === 'w' ? 'Black' : 'White'} wins!`)
    } else if (currentGame.isDraw()) {
      setGameStatus('Draw!')
    } else if (currentGame.isStalemate()) {
      setGameStatus('Stalemate!')
    } else if (currentGame.isCheck()) {
      setGameStatus(`${currentGame.turn() === 'w' ? 'White' : 'Black'} is in check!`)
    } else {
      setGameStatus(`${currentGame.turn() === 'w' ? 'White' : 'Black'} to move`)
    }
  }

  const handleSquareClick = (square: string) => {
    if (selectedSquare) {
      try {
        const move = game.move({
          from: selectedSquare,
          to: square,
          promotion: 'q'
        })

        if (move) {
          if (move.captured) {
            const capturedPiece = move.captured + (move.color === 'w' ? 'b' : 'w')
            setCapturedPieces(prev => ({
              ...prev,
              [move.color === 'w' ? 'white' : 'black']: [...prev[move.color === 'w' ? 'white' : 'black'], capturedPiece]
            }))
          }
          setMoveHistory(prev => [...prev, move.san])
          updateBoard()
        }
      } catch (e) {
        // Invalid move
      }

      setSelectedSquare(null)
      setPossibleMoves([])
    } else {
      const piece = game.get(square as any)
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square)
        const moves = game.moves({ square: square as any, verbose: true })
        setPossibleMoves(moves.map(m => m.to))
      }
    }
  }

  const resetGame = () => {
    const newGame = new Chess()
    setGame(newGame)
    setSelectedSquare(null)
    setPossibleMoves([])
    setMoveHistory([])
    setCapturedPieces({ white: [], black: [] })
    updateBoard()
  }

  const undoMove = () => {
    game.undo()
    setMoveHistory(prev => prev.slice(0, -1))
    setSelectedSquare(null)
    setPossibleMoves([])
    updateBoard()
  }

  const getPieceSymbol = (piece: string | null) => {
    if (!piece) return null
    const type = piece[0]
    const color = piece[1]
    const symbol = color === 'w' ? PIECE_SYMBOLS[type.toUpperCase()] : PIECE_SYMBOLS[type.toLowerCase()]
    return <span className={color === 'w' ? styles.whitePiece : styles.blackPiece}>{symbol}</span>
  }

  const renderCapturedPieces = (pieces: string[]) => {
    return pieces.map((piece, idx) => (
      <span key={idx} className={styles.capturedPiece}>
        {getPieceSymbol(piece)}
      </span>
    ))
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Chess Game</h1>

      <div className={styles.gameContainer}>
        <div className={styles.sidebar}>
          <div className={styles.statusBox}>
            <h2>Game Status</h2>
            <p className={styles.status}>{gameStatus}</p>
          </div>

          <div className={styles.capturedBox}>
            <h3>Captured by White</h3>
            <div className={styles.capturedPieces}>
              {renderCapturedPieces(capturedPieces.white)}
            </div>
          </div>

          <div className={styles.capturedBox}>
            <h3>Captured by Black</h3>
            <div className={styles.capturedPieces}>
              {renderCapturedPieces(capturedPieces.black)}
            </div>
          </div>

          <div className={styles.controls}>
            <button onClick={undoMove} className={styles.button} disabled={moveHistory.length === 0}>
              Undo Move
            </button>
            <button onClick={resetGame} className={styles.button}>
              New Game
            </button>
          </div>
        </div>

        <div className={styles.boardWrapper}>
          <div className={styles.board}>
            {board.map((row, rowIdx) => (
              <div key={rowIdx} className={styles.row}>
                {row.map((sq) => {
                  const isLight = (sq.square.charCodeAt(0) - 97 + (8 - rowIdx)) % 2 === 1
                  const isSelected = selectedSquare === sq.square
                  const isPossibleMove = possibleMoves.includes(sq.square)

                  return (
                    <div
                      key={sq.square}
                      className={`${styles.square} ${isLight ? styles.light : styles.dark} ${isSelected ? styles.selected : ''} ${isPossibleMove ? styles.possible : ''}`}
                      onClick={() => handleSquareClick(sq.square)}
                    >
                      {getPieceSymbol(sq.piece)}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.historyBox}>
            <h3>Move History</h3>
            <div className={styles.moveHistory}>
              {moveHistory.map((move, idx) => (
                <div key={idx} className={styles.move}>
                  {Math.floor(idx / 2) + 1}. {move}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
