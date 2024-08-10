import streamlit as st
import time
import requests
import pandas as pd
import numpy as np
import json


# Streamed response emulator
def response_generator(response):

    for word in response.split():
        yield word + " "
        time.sleep(0.05)

def isPlot(prompt):
    prompt = prompt.lower()

    return "plot" in prompt

def isShow(prompt):
    prompt = prompt.lower()

    return "show" in prompt

def showTable(prompt):
    assistantResult = requests.post("http://192.168.1.9:3000/dbQuery/show" , json ={"question" : prompt , "tableName" : "SalesRecord"}).json()

    # Getting and displaying the dataframe
    df = pd.DataFrame(assistantResult)
    
    with st.chat_message("assistant"):
        st.dataframe(df)

def plotQuery(prompt):
    assistantResult = requests.post("http://192.168.1.9:3000/dbQuery/plot" , json ={"question" : prompt , "tableName" : "SalesRecord"}).json()
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
        st.session_state.messages.append({"role": "assistant", "content": df_selected.to_dict(orient="list") , "isPlot" : True , "chart" : plotNumber})


def answerQuery(prompt):
    assistantResult = requests.post("http://192.168.1.9:3000/dbQuery/" , json ={"question" : prompt , "tableName" : "SalesRecord"}).json()
    with st.chat_message("assistant"):
        st.markdown(assistantResult)

        # Add assistant response to chat history
        st.session_state.messages.append({"role": "assistant", "content": assistantResult , "isPlot" : False})
    


st.title("Simple chat")

# Initialize chat history
if "messages" not in st.session_state:
    st.session_state.messages = []

# Display chat messages from history on app rerun
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        if message["role"] == "assistant" and message["isPlot"]:
            if message["chart"] == 1:
                st.line_chart(pd.DataFrame(message["content"]))
            elif message["chart"] == 2:
                st.bar_chart(pd.DataFrame(message["content"]))
            else:
                st.scatter_chart(pd.DataFrame(message["content"]))
        else:
            st.markdown(message["content"])

# Accept user input
if prompt := st.chat_input("What is up?"):
    # Add user message to chat history
    st.session_state.messages.append({"role": "user", "content": prompt})

    # Display user message in chat message container
    with st.chat_message("user"):
        st.markdown(prompt)

    # Identifying whether it is a plot Query or normal Query or show Query
    if isPlot(prompt):
        plotQuery(prompt)
    elif isShow(prompt):
        showTable(prompt)
    else:
        answerQuery(prompt)



    # Hitting the API and getting the answer
    # assistantResult = requests.post("http://192.168.1.9:3000/dbQuery/" , json ={"question" : prompt , "tableName" : "annual_learning(1)"})
    # print(f"Response from Assistant is : {assistantResult.json()}")
    # Display assistant response in chat message container
    # with st.chat_message("assistant"):
        # response = st.write_stream(response_generator(assistantResult.json()))
        # chart_data = pd.DataFrame(np.random.randn(20, 3), columns=["a", "b", "c"])

        # st.line_chart(chart_data)
        # response = chart_data.to_dict(orient = "list")
        
    # Add assistant response to chat history
    # st.session_state.messages.append({"role": "assistant", "content": response , "isPlot" : True})