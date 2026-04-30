using UnityEngine;
using UnityEngine.UI;
using System.Collections;

public class MovementController : MonoBehaviour 
{
    private Player player;
    private int moveCounter = 0;
    private bool isMoving = false;
    
    void Awake()
    {
        player = GetComponentInParent<Player>();
    }

    private bool IsCurrentPlayer() => GameManager.Instance.CurrentPlayer == player;

    void Update()
    {
        if (!IsCurrentPlayer() || player.currentCell == null || MenuController.isMenuActive) return;

        HandleMovementInput();
    }

    public IEnumerator MoveWithCounter(int moves)
    {
        moveCounter = moves;
        isMoving = true;

        while (moveCounter > 0 && isMoving)
        {
            yield return null;

            if (!IsCurrentPlayer()) continue;
            HandleMovementInput();
        }

        ConfirmLanding();
    }

    private void HandleMovementInput()
    {
        if (Input.GetKeyDown(KeyCode.UpArrow) && player.currentCell.up)
            MoveToCell(player.currentCell.up);
        else if (Input.GetKeyDown(KeyCode.DownArrow) && player.currentCell.down)
            MoveToCell(player.currentCell.down);
        else if (Input.GetKeyDown(KeyCode.LeftArrow) && player.currentCell.left)
            MoveToCell(player.currentCell.left);
        else if (Input.GetKeyDown(KeyCode.RightArrow) && player.currentCell.right)
            MoveToCell(player.currentCell.right);
    }

    private void MoveToCell(Cell targetCell)
    {
        player.currentCell?.OnLeave(); // Trigger OnLeave for the current cell
        player.currentCell = targetCell;
        player.transform.position = targetCell.transform.position;
        if (isMoving) moveCounter--;
        Debug.Log($"Moved to {targetCell.name}. Moves left: {moveCounter}");
        targetCell.OnEnter(); // Trigger OnEnter for the new cell
    }

    private void ConfirmLanding()
    {
        isMoving = false;
        // Assuming these are handled by TurnManager or GameManager
        // currentStage = TurnStage.ConfirmLand;
        // confirmLandMenu.SetActive(true);
        MenuController.isMenuActive = true;
    }
}
