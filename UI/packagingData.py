import json

def getMD(fileName , headingOptions , data):
    tableName = fileName.split(".")[-2].replace(" ","_")
    package = json.dumps({"tableName" : tableName , "data" : data , "metaData" : json.dumps(headingOptions)})

    return package,tableName