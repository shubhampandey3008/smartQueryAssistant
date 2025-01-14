from dotenv import load_dotenv
load_dotenv()
import os
from fileInfoConnector import sendFileDesc
from packagingData import getMD
import streamlit as st
from loguru import logger
import requests

logger.add("logs_new.log")

st.title("SHEET:violet[chat]  :bar_chart:")

file = st.file_uploader("Upload csv/xlsx file" , ['csv' , 'xlsx'] , help="max size 200mb")

headings = []
headingOptions = {}
data = ""

# Process the file
if file is not None:
    try:
        headings, data = sendFileDesc(file)
        logger.info("File uploaded and processed successfully")
    except Exception as e:
        st.error(f"Error processing file: {e}")
        logger.error(f"Error processing file: {e}")
else:
    st.warning("No file uploaded")

# Define data types
dataTypes = ["int", "varchar(100)", "Date"]

# Collect heading options from user
primaryIter = 0
for heading in headings:
    try:
        option = st.selectbox(heading, dataTypes, index=0, placeholder="Choose the Datatype")
        primaryIter += 1
        headingOptions[heading] = option
        if option:
            st.write("You Selected ", option)
    except Exception as e:
        st.error(f"Error selecting datatype for {heading}: {e}")
        logger.error(f"Error selecting datatype for {heading}: {e}")


def sendData(option):
    global tableName
    st.write(option)
    try:
        # Packaging the final metaData along with the data
        metaData, tableName = getMD(file.name, headingOptions, data)
        if "tableName" not in st.session_state:
            st.session_state["tableName"] = tableName

        response = requests.post(f"{os.getenv('NODE_API')}/metaData", json={"metaData": metaData})
        response.raise_for_status()
        st.success("Data submitted successfully")
        logger.info("Data submitted successfully")
    except requests.exceptions.RequestException as e:
        st.error(f"An error occurred while sending data: {e}")
        logger.error(f"An error occurred while sending data: {e}")
    except Exception as e:
        st.error(f"Unexpected error: {e}")
        logger.error(f"Unexpected error: {e}")

if file and st.button("Submit"):
    sendData(headingOptions)
    try:
        st.switch_page("pages/chatPage.py")
    except Exception as e:
        st.error(f"Error switching page: {e}")
        logger.error(f"Error switching page: {e}")
