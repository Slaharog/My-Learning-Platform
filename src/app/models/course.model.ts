export class CourseModel {
    courseId: string;
    title: string;
    description: string;
    createdAt: Date;

    public static toFormData(course: CourseModel): FormData {
        const formData = new FormData();
        formData.append("title", course.title),
        formData.append("description", course.description),
        formData.append("createdAt", course.createdAt.toDateString());
        return formData;
    }
}
  