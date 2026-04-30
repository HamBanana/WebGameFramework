using UnityEngine;
using UnityEngine.UI;
using System.Collections;
using System.Collections.Generic;

public class TurnManager : MonoBehaviour
{
    public GameObject turnStartMenu; // Menu for TurnStartMenu stage
    public GameObject confirmLandMenu; // Menu for ConfirmLand stage
    public Text diceResultText; // Text to display the dice roll result
    public GameObject diceAnimation; // Animated die (toggle active for display)
    public DieController dieController; // Controller object for the die.
    
    private Player currentPlayer;
    private int moveCounter;
    private bool isMoving;
    public enum TurnStage { TurnStartMenu, Roll, Move, ConfirmLand, Landing, EndTurn }
    private TurnStage currentStage;

    public void StartTurn(Player player)
    {
        currentPlayer = player;
        StartTurnStage(TurnStage.TurnStartMenu);
    }

    private MenuController turnStartMenuController;

    void Awake()
    {
        turnStartMenuController = turnStartMenu.GetComponent<MenuController>();
    }

    public void StartTurnStage(TurnStage stage)
    {
        currentStage = stage;
        
        switch (stage)
        {
            case TurnStage.TurnStartMenu:
                SetupTurnStartMenu();
                break;

            case TurnStage.Roll:
                turnStartMenu.SetActive(false);
                MenuController.isMenuActive = false;
                StartCoroutine(RollDice());
                break;

            case TurnStage.Move:
                isMoving = true;
                currentPlayer.BeginMove(moveCounter);
                break;

            case TurnStage.ConfirmLand:
                confirmLandMenu.SetActive(true);
                MenuController.isMenuActive = true;
                break;

            case TurnStage.Landing:
                currentPlayer.currentCell.OnLand();
                StartTurnStage(TurnStage.EndTurn);
                break;

            case TurnStage.EndTurn:
                Debug.Log("Turn ended");
                GameManager.Instance.EndPlayerTurn();
                break;
        }
    }

    private IEnumerator RollDice()
    {
        dieController.gameObject.SetActive(true);
        dieController.RollDie();
        
        yield return new WaitForSeconds(2.5f);
        
        moveCounter = dieController.GetRolledValue();
        Debug.Log($"Player rolled: {moveCounter}");
        dieController.gameObject.SetActive(false);
        
        StartTurnStage(TurnStage.Move);
    }

    private void SetupTurnStartMenu()
    {
        var menuOptions = new List<(string label, System.Action action)>
        {
            ("Roll", () => StartTurnStage(TurnStage.Roll)),
            ("Options", OnOptionsSelected)
        };

        turnStartMenu.SetActive(true);
        MenuController.isMenuActive = true;
        turnStartMenuController.PopulateMenu(menuOptions);
        Debug.Log("Displaying TurnStartMenu");
    }

    public void OnConfirmLand()
    {
        confirmLandMenu.SetActive(false);
        MenuController.isMenuActive = false;
        StartTurnStage(TurnStage.Landing);
    }

    public void OnMovementComplete() => StartTurnStage(TurnStage.ConfirmLand);

    public void OnOptionsSelected()
    {
        Debug.Log("Options menu selected (expand as needed)");
        // Implement options logic here
    }
}
