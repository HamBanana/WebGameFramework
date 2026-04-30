using UnityEngine;
using System.Collections;

public class DieController : MonoBehaviour
{
    public Transform dieTransform; // Assign the die Transform in the Inspector
    public RenderTexture dieRenderTexture; // Assign the Render Texture used for UI
    private int rolledValue = 0;
    private bool isRolling = false;

    public void RollDie()
    {
        if (isRolling) return; // Prevent multiple rolls at the same time

        isRolling = true;

        // Reset the die position and rotation
        dieTransform.localPosition = Vector3.zero;
        dieTransform.localRotation = Quaternion.identity;

        // Start the die roll animation
        StartCoroutine(AnimateDieRoll());
    }

    private IEnumerator AnimateDieRoll()
    {
        // Animate random rotations for 2 seconds
        float rollDuration = 2f;
        float elapsedTime = 0f;

        while (elapsedTime < rollDuration)
        {
            dieTransform.Rotate(Random.Range(90, 360), Random.Range(90, 360), Random.Range(90, 360));
            elapsedTime += Time.deltaTime;
            yield return null;
        }

        // Snap to the final rolled value
        rolledValue = DetermineRollValue();
        SnapToFace(rolledValue);

        Debug.Log($"Rolled value: {rolledValue}");
        isRolling = false; // Allow new rolls
    }

    private int DetermineRollValue()
    {
        Vector3 up = dieTransform.up;

        if (Vector3.Dot(up, Vector3.up) > 0.9f) return 1;
        if (Vector3.Dot(up, Vector3.down) > 0.9f) return 6;
        if (Vector3.Dot(up, Vector3.forward) > 0.9f) return 5;
        if (Vector3.Dot(up, Vector3.back) > 0.9f) return 2;
        if (Vector3.Dot(up, Vector3.left) > 0.9f) return 3;
        if (Vector3.Dot(up, Vector3.right) > 0.9f) return 4;

        return 0; // Error case
    }

    private void SnapToFace(int value)
    {
        switch (value)
        {
            case 1: dieTransform.rotation = Quaternion.Euler(0, 0, 0); break;
            case 2: dieTransform.rotation = Quaternion.Euler(0, 0, 90); break;
            case 3: dieTransform.rotation = Quaternion.Euler(0, 0, 180); break;
            case 4: dieTransform.rotation = Quaternion.Euler(0, 0, -90); break;
            case 5: dieTransform.rotation = Quaternion.Euler(90, 0, 0); break;
            case 6: dieTransform.rotation = Quaternion.Euler(-90, 0, 0); break;
        }
    }

    public int GetRolledValue()
    {
        return rolledValue;
    }
}
