from flask import Flask
from flask import render_template, request


app = Flask(__name__)


@app.route('/')
@app.route('/home')
def home():
    return render_template('home.html')


@app.route('/experience')
def experience():
    return render_template('experience.html')


@app.route('/education')
def education():
    return render_template('education.html')


@app.route('/portfolio')
def portfolio():
    return render_template('portfolio.html')


@app.route('/contact')
def contact():
    return render_template('contact.html')


if __name__ == '__main__':
    app.run(debug=True)
