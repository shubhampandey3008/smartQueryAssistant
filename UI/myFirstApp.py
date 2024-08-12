from dotenv import load_dotenv
load_dotenv()
import os
from fileInfoConnector import sendFileDesc
from packagingData import getMD
import streamlit as st
from loguru import logger
import requests

logger.add("logs_new.log")
tableName=""

st.title("SHEET:violet[chat]  :bar_chart:")

file = st.file_uploader("Upload csv/xlsx file" , ['csv' , 'xlsx'] , help="max size 200mb")

headings = []
headingOptions = {}
data=""

# process the file
if file is not None:
    headings , data = sendFileDesc(file)
    logger.info("Added the file")
else:
    logger.debug("No file found")

dataTypes = [ "int" , "varchar(100)" , "Date" ]



primaryIter = 0
for heading in headings:
    option = st.selectbox(heading , dataTypes , index=None , placeholder="Choose the Datatype")
    primaryIter+=1
    headingOptions[heading] = option
    if option != None:
        st.write("You Selected ", option)


def sendData(option):
    global tableName
    st.write(option)
    # Packaging the final metaData along with the data
    metaData,tableName = getMD(file.name , headingOptions , data)
    print(metaData)

    try:
        response = requests.post(f"{os.getenv('NODE_API')}/metaData" , json ={"metaData" : metaData})
    except requests.exceptions.RequestException as e:
        print(f" An error occured : {e}")

def getTableName():
    return tableName

if file and st.button("Submit"):
    sendData(headingOptions)
    st.switch_page("pages/chatPage.py")


        