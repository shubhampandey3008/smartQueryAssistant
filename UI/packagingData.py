import json

def getMD(fileName , headingOptions , isPrime , data):
    metaData=""
    for key , val in headingOptions.items():
        if key == isPrime:
            metaData= f"{metaData} '{key}' {val} Primary Key , "
        else:
            metaData= f"{metaData} '{key}' {val} , "

    package = json.dumps({"tableName" : fileName , "data" : data , "metaData" : metaData})

    return package