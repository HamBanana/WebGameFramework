using System.Collections.Generic;
using System.Linq;
using UnityEngine;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    public enum GameState
    {
        Setup,          // Initial game setup
        TurnStart,      // Start of a player's turn
        TurnInProgress, // During a player's turn
        TurnEnd,        // End of a player's turn
        GameEnd        // Game has ended
    }

    public enum WinConditionType
    {
        MoneyOnHand,
        TotalValue,
        Level,
        LastManStanding
    }

    [Header("Game Settings")]
    [SerializeField] private GameObject playerPrefab;  // Assign Player.prefab in Inspector
    [SerializeField] private int numberOfPlayers = 4;  // Configure number of players
    [SerializeField] private WinConditionType winConditionType;
    [SerializeField] private int winConditionTarget;
    
    [Header("Game State")]
    public GameState CurrentGameState { get; private set; }
    public List<Player> players { get; private set; }
    public int CurrentPlayerIndex { get; private set; }
    public Player CurrentPlayer => players[CurrentPlayerIndex];

    [Header("References")]
    public TurnManager turnManager;
    private Cell[] allCells;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }

    void Start()
    {
        players = new List<Player>();
        InitializeGame();
    }

    private void InitializeGame()
    {
        CurrentGameState = GameState.Setup;
        CurrentPlayerIndex = 0;
        allCells = FindObjectsByType<Cell>(FindObjectsSortMode.None);

        // Create players
        for (int i = 0; i < numberOfPlayers; i++)
        {
            GameObject playerObj = Instantiate(playerPrefab);
            Player player = playerObj.GetComponent<Player>();
            players.Add(player);
            
            // Set initial position to first cell if available
            if (allCells.Length > 0)
            {
                playerObj.transform.position = allCells[0].transform.position;
                player.currentCell = allCells[0];
            }
        }
        
        // Link neighbors for each cell
        foreach (Cell cell in allCells)
        {
            LinkNeighbors(cell);
        }

        StartGame();
    }

    private void StartGame()
    {
        CurrentGameState = GameState.TurnStart;
        StartPlayerTurn();
    }

    private void StartPlayerTurn()
    {
        Debug.Log($"Starting turn for Player {CurrentPlayerIndex + 1}");
        turnManager.StartTurn(CurrentPlayer);
    }

    public void EndPlayerTurn()
    {
        // Move to next player
        CurrentPlayerIndex = (CurrentPlayerIndex + 1) % players.Count();
        
        // Check for game end condition
        if (CheckWinCondition())
        {
            EndGame();
        }
        else
        {
            StartPlayerTurn();
        }
    }

    private bool CheckWinCondition()
    {
        switch (winConditionType)
        {
            case WinConditionType.MoneyOnHand:
                return players.Exists(p => p.Money >= winConditionTarget);
            case WinConditionType.TotalValue:
                return players.Exists(p => p.TotalValue >= winConditionTarget);
            case WinConditionType.Level:
                return players.Exists(p => p.Level >= winConditionTarget);
            case WinConditionType.LastManStanding:
                return players.Count(p => !p.IsBankrupt) == 1;
            default:
                return false;
        }
    }

    private void EndGame()
    {
        CurrentGameState = GameState.GameEnd;
        Player winner = DetermineWinner();
        Debug.Log($"Game Over! Winner: Player {players.IndexOf(winner) + 1}");
        // Trigger game end UI/events
    }

    private Player DetermineWinner()
    {
        switch (winConditionType)
        {
            case WinConditionType.MoneyOnHand:
                return players.OrderByDescending(p => p.Money).First();
            case WinConditionType.TotalValue:
                return players.OrderByDescending(p => p.TotalValue).First();
            case WinConditionType.Level:
                return players.OrderByDescending(p => p.Level).First();
            case WinConditionType.LastManStanding:
                return players.First(p => !p.IsBankrupt);
            default:
                return players[0];
        }
    }

    private void LinkNeighbors(Cell cell)
    {
        Vector3[] directions = {
            new Vector3(0,0,-1), new Vector3(0,0,1),
            new Vector3(1,0,0), new Vector3(-1,0,0)
        };

        foreach (var dir in directions)
        {
            Vector3 neighborPosition = cell.transform.position + dir;
            Cell neighbor = FindCellAtPosition(neighborPosition);

            if (neighbor != null)
            {
                if (dir == directions[0]) cell.up = neighbor;
                if (dir == directions[1]) cell.down = neighbor;
                if (dir == directions[2]) cell.left = neighbor;
                if (dir == directions[3]) cell.right = neighbor;
            }
        }
    }

    private Cell FindCellAtPosition(Vector3 position)
    {
        foreach (Cell cell in allCells)
        {
            if (Vector3.Distance(cell.transform.position, position) < 0.1f)
                return cell;
        }
        return null;
    }
}
