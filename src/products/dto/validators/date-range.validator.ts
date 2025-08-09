import { 
  ValidatorConstraint, 
  ValidatorConstraintInterface, 
  ValidationArguments,
  registerDecorator,
  ValidationOptions 
} from 'class-validator';

@ValidatorConstraint({ name: 'isDateAfter', async: false })
export class IsDateAfterConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (!value) return true; // Allow empty values (handled by @IsOptional)
    
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    
    if (!relatedValue) return true; // If start date is not provided, end date can be anything
    
    const startDate = new Date(relatedValue);
    const endDate = new Date(value);
    
    return endDate > startDate;
  }

  defaultMessage(args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    return `${args.property} must be after ${relatedPropertyName}`;
  }
}

export function IsDateAfter(property: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsDateAfterConstraint,
    });
  };
}
