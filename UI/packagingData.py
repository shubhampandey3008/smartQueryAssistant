import json

def getMD(fileName, headingOptions, data):
    try:
        if not fileName or not headingOptions or not data:
            raise ValueError("Invalid input: fileName, headingOptions, and data must be provided")

        tableName = fileName.split(".")[-2].replace(" ", "_")
        package = json.dumps({
            "tableName": tableName,
            "data": data,
            "metaData": json.dumps(headingOptions)
        })

        return package, tableName
    except (IndexError, AttributeError) as e:
        raise ValueError(f"Error processing fileName '{fileName}': {e}")
    except json.JSONDecodeError as e:
        raise ValueError(f"Error encoding JSON: {e}")
    except Exception as e:
        raise RuntimeError(f"Unexpected error in getMD: {e}")
