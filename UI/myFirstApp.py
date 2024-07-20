import streamlit as st
from loguru import logger
from packagingData import getMD
from fileInfoConnector import sendFileDesc
import requests

logger.add("logs_new.log")

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

dataTypes = [ "int" , "varchar" , "Date" ]



primaryIter = 0
for heading in headings:
    option = st.selectbox(heading , dataTypes , index=None , placeholder="Choose the Datatype")
    primaryIter+=1
    headingOptions[heading] = option
    if option != None:
        st.write("You Selected ", option)

primaryKey = st.markdown("<br>", unsafe_allow_html=True) 


# Showing the radio button only when the file is uploaded
if file:
    st.markdown("## Primary Key" )
    isPrime = st.radio(label="label" , options=headings , key=primaryIter , label_visibility="collapsed")


def sendData(option):
    st.write(option)
    # Packaging the final metaData along with the data
    metaData = getMD(file.name , headingOptions , isPrime , data)
    print(metaData)

    try:
        response = requests.post("http://192.168.1.9:3000/metaData" , json ={"metaData" : metaData})
    except requests.exceptions.RequestException as e:
        print(f" An error occured : {e}")

if file and st.button("Submit"):
    sendData(headingOptions)


# if st.button("")
        