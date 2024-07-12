import streamlit as st
from loguru import logger
from fileInfoConnector import sendFileDesc

logger.add("logs_new.log")

file = st.file_uploader("Upload csv/xlsx file" , ['csv' , 'xlsx'] , help="max size 200mb")

headings = []
headingOptions = {}

# process the file
if file is not None:
    headings , data = sendFileDesc(file)
    logger.info("Added the file")
else:
    logger.debug("No file found")

dataTypes = [ "int" , "varchar" , "Date" ]

for heading in headings:
    option = st.selectbox(heading , dataTypes , index=None , placeholder="Choose the Datatype")
    isPrime = st.radio("")
    headingOptions[heading] = option
    if option != None:
        st.write("You Selected ", option)

def sendData(option):
    st.write(option)

if st.button("Submit"):
    sendData(headingOptions)
        