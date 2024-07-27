import json

def getMD(fileName , headingOptions , isPrime , data):

    package = json.dumps({"tableName" : fileName.split(".")[-2].replace(" ","_") , "data" : data , "metaData" : json.dumps(headingOptions) , "Primary Key" : isPrime})

    return package