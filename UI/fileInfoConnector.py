import pandas as pd

def readCSV(file):
    df = pd.read_csv(file)
    print(df.head())
    return df.columns.to_list()

def readExcel(file):
    df = pd.read_excel(file)
    print(df.head())
    return df.columns.tolist()

def sendFileDesc(file):

    # check the extension of the file
    extension = file.name.split(".")[-1]

    # List to store the headings
    heading = []
    data = {}

    if extension == 'csv':
        heading , data = readCSV(file)
    else:
        heading , data = readExcel(file)

    return heading