import pandas as pd
import json
from typing import Tuple, List
import logging
from pathlib import Path
from io import BytesIO

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FileProcessingError(Exception):
    """Custom exception for file processing errors"""
    pass

def validate_file(file) -> str:
    """
    Validates if the uploaded file has a supported extension

    Args:
        file: Uploaded file object (from Streamlit)

    Returns:
        File extension

    Raises:
        FileProcessingError: If file is invalid or unsupported
    """
    try:
        if not file:
            raise FileProcessingError("No file provided")
        
        file_extension = Path(file.name).suffix.lower()
        if file_extension not in ['.csv', '.xlsx', '.xls']:
            raise FileProcessingError(f"Unsupported file format: {file_extension}")
        
        return file_extension
    except AttributeError as e:
        raise FileProcessingError(f"Invalid file object: {str(e)}")
    except Exception as e:
        raise FileProcessingError(f"Error validating file: {str(e)}")

def readCSV(file) -> Tuple[List[str], pd.DataFrame]:
    """
    Reads and processes a CSV file

    Args:
        file: Uploaded CSV file object

    Returns:
        Tuple of (column names list, processed DataFrame)

    Raises:
        FileProcessingError: If there's an error reading or processing the CSV
    """
    try:
        df = pd.read_csv(file, dtype=str)
        df = df.dropna()

        if df.empty:
            raise FileProcessingError("CSV file is empty after processing")

        return df.columns.tolist(), df
    except pd.errors.EmptyDataError:
        raise FileProcessingError("CSV file is empty")
    except pd.errors.ParserError as e:
        raise FileProcessingError(f"Error parsing CSV file: {str(e)}")
    except Exception as e:
        raise FileProcessingError(f"Error processing CSV file: {str(e)}")

def readExcel(file) -> Tuple[List[str], pd.DataFrame]:
    """
    Reads and processes an Excel file

    Args:
        file: Uploaded Excel file object

    Returns:
        Tuple of (column names list, processed DataFrame)

    Raises:
        FileProcessingError: If there's an error reading or processing the Excel file
    """
    try:
        df = pd.read_excel(file, dtype=str)
        df = df.dropna()

        if df.empty:
            raise FileProcessingError("Excel file is empty after processing")

        return df.columns.tolist(), df
    except pd.errors.EmptyDataError:
        raise FileProcessingError("Excel file is empty")
    except Exception as e:
        raise FileProcessingError(f"Error processing Excel file: {str(e)}")

def sendFileDesc(file) -> Tuple[List[str], str]:
    """
    Processes an uploaded file and returns its column headers and JSON data

    Args:
        file: Uploaded file object (from Streamlit)

    Returns:
        Tuple of (column headers list, JSON string)

    Raises:
        FileProcessingError: If there's an error in file processing
    """
    try:
        # Validate file
        file_extension = validate_file(file)

        # Process file based on extension
        if file_extension == '.csv':
            heading, df = readCSV(file)
        else:
            heading, df = readExcel(file)

        # Convert to JSON
        data = df.to_json(orient='records')
        if not data:
            raise FileProcessingError("Failed to convert DataFrame to JSON")

        return heading, data
    except FileProcessingError as e:
        logger.error(f"File processing error: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise FileProcessingError(f"Unexpected error processing file: {str(e)}")
