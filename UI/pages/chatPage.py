import streamlit as st
import time
import requests
import pandas as pd
import numpy as np
import os
import io
from myFirstApp import getTableName



def getAllData(tableName):
    assistantResult = requests.post(f"{os.getenv('NODE_API')}/dbQuery/show" , json ={"question" : "show all data" , "tableName" : tableName}).json()
    download_df = pd.DataFrame(assistantResult)

    buffer = io.BytesIO()

    download_df.to_excel(buffer , index=False , engine='xlsxwriter')
    buffer.seek(0)

    return buffer.getvalue()

st.title("SHEET:violet[chat]  :bar_chart:")

# Streamed response emulator
def response_generator(response):

    for word in response.split():
        yield word + " "
        time.sleep(0.05)

def isDownload(prompt):
    prompt = prompt.lower()

    return "download" in prompt

def isPlot(prompt):
    prompt = prompt.lower()

    return "plot" in prompt

def isShow(prompt):
    prompt = prompt.lower()

    return "show" in prompt

def downloadExcel(tableName):
    st.download_button("Click Here to Download excel file" , data=getAllData(tableName) , file_name=f"{tableName}.xlsx")
    # Add assistant response to chat history
    st.session_state.messages.append({"role": "assistant", "content": "File Download" , "isPlot" : False , "isShow" : False})

def showTable(prompt , tableName):
    assistantResult = requests.post(f"{os.getenv('NODE_API')}/dbQuery/show" , json ={"question" : prompt , "tableName" : tableName}).json()

    # Getting and displaying the dataframe
    df = pd.DataFrame(assistantResult)
    
    with st.chat_message("assistant"):
        st.dataframe(df)

        # Add assistant response to chat history
        st.session_state.messages.append({"role": "assistant", "content": df , "isPlot" : False , "isShow" : True})

def plotQuery(prompt,tableName):
    assistantResult = requests.post(f"{os.getenv('NODE_API')}/dbQuery/plot" , json ={"question" : prompt , "tableName" : tableName}).json()
    print(assistantResult)

    # Extracting the plot type , the columns and the data
    df = pd.DataFrame(assistantResult["allData"])
    cols = assistantResult["plotData"]["columns"]

    df_selected = df[cols]

    plotNumber = assistantResult["plotData"]["plot"]

    with st.chat_message("assistant"):
        if plotNumber == 1 :
            st.line_chart(df_selected , x=cols[0])
        elif plotNumber == 2 :
            st.bar_chart(df_selected , x=cols[0])
        else:
            st.scatter_chart(df_selected , x=cols[0])

         # Add assistant response to chat history
        st.session_state.messages.append({"role": "assistant", "content": df_selected.to_dict(orient="list") , "isPlot" : True , "isShow" : False , "chart" : plotNumber , "cols" : cols})


def answerQuery(prompt , tableName):
    assistantResult = requests.post(f"{os.getenv('NODE_API')}/dbQuery/" , json ={"question" : prompt , "tableName" : tableName}).json()
    with st.chat_message("assistant"):
        st.markdown(assistantResult)

        # Add assistant response to chat history
        st.session_state.messages.append({"role": "assistant", "content": assistantResult , "isPlot" : False , "isShow" : False})

# Initialize chat history
if "messages" not in st.session_state:
    st.session_state.messages = []

# Display chat messages from history on app rerun
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        if message["role"] == "assistant" and message["isPlot"]:
            if message["chart"] == 1:
                st.line_chart(pd.DataFrame(message["content"]) , x=message["cols"][0])
            elif message["chart"] == 2:
                st.bar_chart(pd.DataFrame(message["content"]), x=message["cols"][0])
            else:
                st.scatter_chart(pd.DataFrame(message["content"]), x=message["cols"][0])
        elif message["role"] == "assistant" and message["isShow"]:
            st.dataframe(message["content"])
        else:
            st.markdown(message["content"])

# Accept user input
if prompt := st.chat_input("What is up?"):
    # Add user message to chat history
    st.session_state.messages.append({"role": "user", "content": prompt})

    # Display user message in chat message container
    with st.chat_message("user"):
        st.markdown(prompt)

    tableName = getTableName()

    # Identifying whether it is a plot Query or normal Query or show Query
    if isPlot(prompt):
        plotQuery(prompt,tableName)
    elif isShow(prompt):
        showTable(prompt,tableName)
    elif isDownload(prompt):
        downloadExcel(tableName)
    else:
        answerQuery(prompt,tableName)
