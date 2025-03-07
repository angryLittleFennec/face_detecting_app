from ultralytics import YOLO

model = YOLO("yolov8n.pt")

results = model(["images/image.png"])

for result in results:
    boxes = result.boxes
    print(result.boxes)
    masks = result.masks
    keypoints = result.keypoints
    probs = result.probs
    obb = result.obb
    result.show()
    #print(masks)
    print(type(result))
    result.save(filename="result.jpg")  # save to disk