FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "-m", "flask", "run", "--host=0.0.0.0"]
EXPOSE 5000