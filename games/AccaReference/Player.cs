using UnityEngine;

public class Player : MonoBehaviour
{
    public Cell currentCell; // Assign this in the Inspector or dynamically
    private MovementController movementController;

    // Properties for win conditions
    public int Money { get; private set; }
    public int TotalValue { get; private set; }
    public int Level { get; private set; }
    public bool IsBankrupt { get; private set; }
    //public List<Cell> OwnedProperties { get; private set; } = new List<Cell>();

    void Awake()
    {
        // Create MovementController as a child GameObject
        GameObject controllerObj = new GameObject("MovementController");
        controllerObj.transform.SetParent(transform);
        movementController = controllerObj.AddComponent<MovementController>();
    }

    public void BeginMove(int moves)
    {
        StartCoroutine(movementController.MoveWithCounter(moves));
    }
}
