import pandas as pd
import json

def readCSV(file):
    df = pd.read_csv(file , dtype=str)
    df = df.dropna()
    return df.columns.to_list() , df

def readExcel(file):
    df = pd.read_excel(file , dtype=str)
    df = df.dropna()
    return df.columns.tolist() , df

def sendFileDesc(file):

    # check the extension of the file
    extension = file.name.split(".")[-1]

    # List to store the headings
    heading = []
    data = {}

    if extension == 'csv':
        heading , df = readCSV(file)
    else:
        heading , df = readExcel(file)

    # Convert into json
    data = df.to_json(orient='records')
    # data = json.dumps(data)
    

    return heading , data