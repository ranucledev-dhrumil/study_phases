from flask_wtf import FlaskForm
from wtforms import StringField, SelectField
from wtforms.validators import DataRequired, Length

class ApplicationForm(FlaskForm):
    company = StringField("Company", validators=[DataRequired(), Length(max=100)])
    status = SelectField("Status", choices=[("applied", "Applied"), ("interview", "Interview"), ("rejected", "Rejected")])